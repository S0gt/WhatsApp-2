const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { testConnection, initializeTables } = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const uploadRoutes = require('./routes/uploads');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO para chat en tiempo real
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Usuario se une a la aplicación
  socket.on('join', (userData) => {
    activeUsers.set(socket.id, userData);
    socket.broadcast.emit('user_joined', userData);
  });

  // Usuario se une a una sala
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Usuario ${socket.id} se unió a la sala ${roomId}`);
  });

  // Enviar mensaje a sala
  socket.on('send_message', (data) => {
    // Emitir a otros usuarios en la sala (no al remitente)
    socket.to(data.roomId).emit('new_message', {
      id: Date.now(),
      message_text: data.message_text,
      message_type: data.message_type || 'text',
      user_id: data.user.id,
      username: data.user.username,
      profile_picture: data.user.profile_picture,
      created_at: new Date(),
      roomId: data.roomId
    });
  });

  // Enviar mensaje privado
  socket.on('private_message', (data) => {
    // Guardar mensaje en base de datos aquí
    socket.to(data.recipientId).emit('new_private_message', {
      id: Date.now(),
      message: data.message,
      from: data.from,
      timestamp: new Date(),
      type: data.type || 'text'
    });
  });

  // Usuario escribiendo
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      user: data.user,
      isTyping: data.isTyping
    });
  });

  // Desconexión
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      activeUsers.delete(socket.id);
      socket.broadcast.emit('user_left', userData);
    }
    console.log('Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

// Función para inicializar el servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    console.log('🔍 Verificando conexión a MySQL...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a MySQL. Verifica tu configuración.');
      console.log('💡 Asegúrate de que MySQL esté ejecutándose y las credenciales en .env sean correctas');
      process.exit(1);
    }

    // Inicializar tablas
    console.log('🗄️ Inicializando tablas de la base de datos...');
    await initializeTables();

    // Iniciar servidor
    server.listen(PORT, () => {
      console.log('🎉 ¡SuperChat iniciado exitosamente!');
      console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
      console.log(`📱 Accede en: http://localhost:${PORT}`);
      console.log('🔗 Base de datos conectada y configurada');
      console.log('⚡ Socket.IO listo para conexiones en tiempo real');
      console.log('📁 Sistema de archivos configurado');
      console.log('');
      console.log('🌟 ¡Todo listo! Abre tu navegador y empieza a chatear');
    });

  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

// Inicializar servidor
startServer();
