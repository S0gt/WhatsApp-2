const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'whatsapp2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promisificar para usar async/await
const promisePool = pool.promise();

// Función para probar la conexión
async function testConnection() {
  try {
    const [rows] = await promisePool.execute('SELECT 1');
    console.log('✅ Conexión a MySQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
}

// Función para inicializar las tablas
async function initializeTables() {
  try {
    console.log('📊 Base de datos WhatsApp 2 verificada');
    
    // Crear tabla de usuarios
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(255) DEFAULT NULL,
        status_message TEXT DEFAULT NULL,
        theme_preference VARCHAR(20) DEFAULT 'light',
        custom_background VARCHAR(255) DEFAULT NULL,
        privacy_settings JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de salas
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Crear tabla de mensajes
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        room_id INT,
        recipient_id INT DEFAULT NULL,
        message_text TEXT,
        message_type ENUM('text', 'image', 'video', 'audio', 'document') DEFAULT 'text',
        file_path VARCHAR(255) DEFAULT NULL,
        file_name VARCHAR(255) DEFAULT NULL,
        file_size INT DEFAULT NULL,
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Crear tabla de participantes de salas
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS room_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        room_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role ENUM('member', 'admin', 'owner') DEFAULT 'member',
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participation (room_id, user_id)
      )
    `);

    // Crear tabla de chats privados
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS private_chats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user1_id INT NOT NULL,
        user2_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX unique_chat (user1_id, user2_id)
      )
    `);

    console.log('🗄️ Todas las tablas han sido creadas/verificadas');
    
    // Crear salas públicas por defecto
    await createDefaultRooms();
    
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error.message);
  }
}

// Función para crear salas por defecto
async function createDefaultRooms() {
  try {
    const defaultRooms = [
      { name: 'General', description: 'Sala general para todos los usuarios' },
      { name: 'Tecnología', description: 'Habla sobre tecnología y programación' },
      { name: 'Música', description: 'Comparte y habla sobre música' },
      { name: 'Deportes', description: 'Discute sobre deportes y eventos' },
      { name: 'Juegos', description: 'Para gamers y entusiastas de videojuegos' }
    ];

    for (const room of defaultRooms) {
      await promisePool.execute(
        'INSERT IGNORE INTO rooms (name, description, is_public) VALUES (?, ?, TRUE)',
        [room.name, room.description]
      );
    }
    
    console.log('🏠 Salas por defecto creadas');
  } catch (error) {
    console.error('❌ Error creando salas por defecto:', error.message);
  }
}

module.exports = {
  pool: promisePool,
  testConnection,
  initializeTables
};
