# 🚀 Guía de Instalación - SuperChat

Esta guía te ayudará a instalar y configurar SuperChat en tu sistema, tanto en **macOS** como en **Windows**.

## 📋 Requisitos Previos

Antes de comenzar, necesitas tener instalado:
- **Node.js** (versión 16 o superior)
- **MySQL** (versión 8.0 o superior)
- **Git** (para clonar el repositorio)

---

## 🍎 Instalación en macOS

### 1. Instalar Homebrew (si no lo tienes)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Instalar Node.js
```bash
# Opción 1: Con Homebrew (recomendado)
brew install node

# Opción 2: Descargar desde https://nodejs.org/
```

### 3. Instalar MySQL
```bash
# Instalar MySQL
brew install mysql

# Iniciar el servicio de MySQL
brew services start mysql

# Conectar a MySQL (sin contraseña por defecto)
mysql -u root
```

### 4. Verificar instalaciones
```bash
# Verificar Node.js y npm
node --version
npm --version

# Verificar MySQL
mysql --version
```

---

## 🪟 Instalación en Windows

### 1. Instalar Node.js
1. Ve a [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión LTS (recomendada)
3. Ejecuta el instalador y sigue las instrucciones
4. Reinicia tu terminal/PowerShell

### 2. Instalar MySQL
1. Ve a [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
2. Descarga "MySQL Community Server"
3. Ejecuta el instalador
4. Durante la instalación:
   - Elige "Developer Default" o "Server only"
   - Configura una contraseña para el usuario `root` (anótala)
   - Deja el puerto por defecto (3306)

### 3. Instalar Git (si no lo tienes)
1. Ve a [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Descarga e instala Git for Windows

### 4. Verificar instalaciones
Abre PowerShell o CMD y ejecuta:
```cmd
node --version
npm --version
mysql --version
git --version
```

---

## 📁 Configuración del Proyecto

### 1. Clonar o descargar el proyecto
```bash
# Si tienes Git configurado
git clone <URL_DEL_REPOSITORIO>
cd superchat

# O simplemente descomprime la carpeta del proyecto
cd superchat
```

### 2. Instalar dependencias de Node.js
```bash
npm install
```

### 3. Configurar la base de datos

#### En macOS:
```bash
# Conectar a MySQL
mysql -u root

# Crear base de datos
CREATE DATABASE superchat;
exit;

# Ejecutar el esquema
mysql -u root superchat < db/schema.sql
```

#### En Windows:
```cmd
# Conectar a MySQL (te pedirá la contraseña que configuraste)
mysql -u root -p

# Crear base de datos
CREATE DATABASE superchat;
exit;

# Ejecutar el esquema
mysql -u root -p superchat < db/schema.sql
```

### 4. Configurar variables de entorno

Edita el archivo `.env` en la raíz del proyecto:

**Para macOS (sin contraseña):**
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=superchat
JWT_SECRET=superchat_secret_key_change_in_production
```

**Para Windows (con contraseña):**
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=superchat
JWT_SECRET=superchat_secret_key_change_in_production
```

---

## 🚀 Instrucciones para Lanzar SuperChat

### 1. Verificar que MySQL esté funcionando

#### macOS:
```bash
# Verificar si MySQL está ejecutándose
brew services list | grep mysql

# Si no está ejecutándose, iniciarlo
brew services start mysql
```

#### Windows:
```cmd
# Verificar servicios de MySQL
sc query mysql80

# O abrir "Servicios" desde el menú de Windows y buscar MySQL
```

### 2. Iniciar el servidor en modo desarrollo
```bash
npm run dev
```

### 3. Iniciar el servidor en modo producción
```bash
npm start
```

### 4. Abrir la aplicación
1. Abre tu navegador web
2. Ve a: **http://localhost:3000**
3. ¡Listo! Ya puedes usar SuperChat

---

## ✅ Verificación de que todo funciona

Cuando ejecutes `npm run dev`, deberías ver algo así:
```
🔍 Verificando conexión a MySQL...
✅ Conexión a MySQL establecida correctamente
🗄️ Inicializando tablas de la base de datos...
📊 Base de datos SuperChat verificada
🗄️ Todas las tablas han sido creadas/verificadas
🏠 Salas por defecto creadas
🎉 ¡SuperChat iniciado exitosamente!
🚀 Servidor funcionando en puerto 3000
📱 Accede en: http://localhost:3000
🔗 Base de datos conectada y configurada
⚡ Socket.IO listo para conexiones en tiempo real
📁 Sistema de archivos configurado

🌟 ¡Todo listo! Abre tu navegador y empieza a chatear
```

---

## 🔧 Solución de Problemas Comunes

### ❌ Error "mysql: command not found"
- **macOS**: Ejecuta `brew install mysql`
- **Windows**: Asegúrate de que MySQL esté en el PATH del sistema

### ❌ Error "Cannot connect to MySQL"
- Verifica que MySQL esté ejecutándose
- Comprueba las credenciales en el archivo `.env`
- En Windows, asegúrate de usar la contraseña correcta

### ❌ Error "Port 3000 already in use"
- Cambia el puerto en `.env`: `PORT=3001`
- O mata el proceso que usa el puerto 3000

### ❌ Error "npm: command not found"
- Reinstala Node.js desde la página oficial
- Reinicia tu terminal después de la instalación

### ❌ Error de permisos en macOS
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

---

## 📱 Primeros Pasos en SuperChat

1. **Registrarse**: Crea tu cuenta con email y contraseña
2. **Personalizar perfil**: Sube una foto y establece tu estado
3. **Unirse a salas**: Explora las salas públicas disponibles
4. **Chat privado**: Busca usuarios en línea e inicia conversaciones
5. **Subir archivos**: Comparte imágenes, videos y documentos
6. **Personalizar**: Cambia entre tema claro y oscuro

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa que todos los servicios estén ejecutándose
2. Comprueba los logs en la consola donde ejecutaste `npm run dev`
3. Verifica que el archivo `.env` tenga la configuración correcta
4. Asegúrate de que el puerto 3000 no esté siendo usado por otra aplicación

---

## 🎉 ¡Disfruta SuperChat!

Una vez que todo esté funcionando, tendrás acceso a:
- ✅ Chat en tiempo real
- ✅ Salas públicas y chats privados
- ✅ Subida de archivos multimedia
- ✅ Personalización completa
- ✅ Sistema de usuarios en línea
- ✅ Interfaz moderna y responsive

**¡Feliz chateo! 💬✨**
