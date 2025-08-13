# 💬 SuperChat

Una aplicación de chat en tiempo real inspirada en chatgratis.net, desarrollada con tecnologías modernas.

## 🌐 Demo en Vivo

🚀 **[Ver aplicación en vivo](https://superchat.onrender.com)** (próximamente)

## ✨ Características

- 🔐 **Autenticación completa** - Registro, login y gestión de sesiones
- 💬 **Chat en tiempo real** - Mensajes instantáneos con Socket.IO
- 🏠 **Salas públicas** - General, Tecnología, Música, Deportes, Juegos
- 👥 **Chats privados** - Conversaciones uno a uno
- 📁 **Carga de archivos** - Imágenes, videos, audios y documentos
- 🎨 **Personalización** - Temas claro/oscuro, avatares, estados
- 📱 **Responsive** - Funciona en móviles, tablets y escritorio

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express.js, Socket.IO, MySQL
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Base de datos**: MySQL con esquema relacional
- **Autenticación**: JWT + bcrypt
- **Tiempo real**: Socket.IO

## 🚀 Instalación Local

1. **Clonar repositorio**
```bash
git clone https://github.com/tu-usuario/superchat.git
cd superchat
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar MySQL**
```bash
# Mac con Homebrew
brew install mysql
brew services start mysql
mysql -u root -p -e "CREATE DATABASE superchat;"
```

4. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tu configuración
```

5. **Iniciar aplicación**
```bash
npm run dev  # Desarrollo
npm start    # Producción
```

6. **Abrir navegador**: http://localhost:3000

## 🌐 Despliegue en Render

### Variables de entorno necesarias:
```env
NODE_ENV=production
PORT=10000
DB_HOST=tu-mysql-host
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=superchat
JWT_SECRET=tu-jwt-secret-seguro
```

### Configuración en Render:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node.js

## 📁 Estructura

```
superchat/
├── server/                 # Backend
│   ├── app.js             # Servidor principal
│   ├── db.js              # Configuración MySQL
│   └── routes/            # Rutas API
├── public/                # Frontend
│   ├── index.html         # SPA principal
│   ├── css/style.css      # Estilos
│   └── js/                # JavaScript modules
└── uploads/               # Archivos subidos
```

## 🎯 Uso

1. **Registro/Login** - Crear cuenta nueva o iniciar sesión
2. **Explorar salas** - Unirse a conversaciones temáticas
3. **Chat público** - Participar en salas abiertas
4. **Chat privado** - Conversaciones directas
5. **Compartir archivos** - Subir imágenes, videos, etc.
6. **Personalizar** - Cambiar tema, avatar y estado

## 🔧 Scripts Disponibles

```bash
npm start      # Producción
npm run dev    # Desarrollo con nodemon
npm install    # Instalar dependencias
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐
