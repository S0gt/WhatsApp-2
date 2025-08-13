# SuperChat - Despliegue en Render

## Pasos para desplegar en Render

### 1. Preparativos
- ✅ Código subido a GitHub
- ✅ Variables de entorno configuradas
- ✅ Scripts de build listos

### 2. Configuración en Render

#### A. Crear Web Service
1. Ve a [render.com](https://render.com) y crea cuenta
2. Click en "New" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `superchat`

#### B. Configuración del servicio
```
Name: superchat (o el que prefieras)
Environment: Node.js
Region: Oregon (US West) - más cercano
Branch: main

Build Command: npm install
Start Command: npm start

Instance Type: Free (para empezar)
```

#### C. Variables de entorno necesarias
```env
NODE_ENV=production
PORT=10000
DB_HOST=tu-database-host
DB_USER=tu-database-user
DB_PASSWORD=tu-database-password
DB_NAME=superchat
JWT_SECRET=un-secret-muy-seguro-y-largo-para-produccion
SOCKET_CORS_ORIGIN=https://tu-app-name.onrender.com
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads
```

### 3. Base de Datos

#### Opción A: MySQL en Railway (Recomendado)
1. Ve a [railway.app](https://railway.app)
2. Crea proyecto → Add MySQL
3. Copia las credenciales de conexión
4. Úsalas en las variables de entorno de Render

#### Opción B: MySQL en PlanetScale
1. Ve a [planetscale.com](https://planetscale.com)
2. Crea base de datos gratuita
3. Obtén string de conexión
4. Configura en Render

#### Opción C: MySQL en Aiven
1. Ve a [aiven.io](https://aiven.io)
2. Crea servicio MySQL gratuito
3. Obtén credenciales
4. Configura en Render

### 4. Pasos finales

1. **Deploy**: Render automáticamente hace build y deploy
2. **Dominio**: Usar el dominio que Render asigna
3. **SSL**: Render incluye SSL automático
4. **Logs**: Revisar logs en Render dashboard

### 5. Verificación

Una vez desplegado:
- ✅ Acceder a tu URL de Render
- ✅ Probar registro de usuario
- ✅ Probar login
- ✅ Probar envío de mensajes
- ✅ Probar subida de archivos

### 6. Configuración de dominio personalizado (Opcional)

Si tienes un dominio propio:
1. En Render → Settings → Custom Domains
2. Agregar tu dominio
3. Configurar DNS según instrucciones
4. Actualizar SOCKET_CORS_ORIGIN

### 7. Monitoreo

- Render Dashboard para logs y métricas
- Base de datos: usar dashboard del proveedor
- Uptime: Render incluye monitoreo básico

## Variables de entorno completas para Render

```env
# Básicas
NODE_ENV=production
PORT=10000

# Base de datos (reemplazar con tus valores reales)
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=tu-password-de-railway
DB_NAME=railway
DB_PORT=5432

# Seguridad
JWT_SECRET=un-jwt-secret-super-seguro-de-al-menos-32-caracteres

# CORS y Socket.IO
SOCKET_CORS_ORIGIN=https://tu-app-name.onrender.com

# Archivos
MAX_FILE_SIZE=52428800
UPLOAD_DIR=uploads

# URLs
CLIENT_URL=https://tu-app-name.onrender.com
API_URL=https://tu-app-name.onrender.com/api
```

## Troubleshooting

### Errores comunes:

1. **Build fails**: Verificar package.json y Node version
2. **Database connection**: Verificar credenciales y whitelist IP
3. **Socket.IO not working**: Verificar CORS_ORIGIN
4. **Files not uploading**: Verificar permisos de directorio

### Logs útiles:
```bash
# En Render dashboard
- Build logs: para errores de build
- Deploy logs: para errores de inicio
- Application logs: para errores de runtime
```

## Costos estimados

- **Render Web Service**: $0 (Free tier) → $7/mes (Starter)
- **Railway MySQL**: $0 (512MB) → $5/mes (1GB)
- **Total**: Gratis para empezar, ~$12/mes para uso real

¡Tu SuperChat estará disponible 24/7 en internet! 🚀
