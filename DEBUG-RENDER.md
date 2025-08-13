# 🔍 Debugging WhatsApp 2 en Render

Este documento ayuda a diagnosticar problemas de conexión a MySQL en el despliegue de Render.

## 📊 Rutas de Debug Disponibles

Una vez desplegado en Render, puedes usar estas URLs para diagnosticar problemas:

### 1. Estado General
```
GET https://tu-app.onrender.com/api/debug/status
```
Muestra si la API está funcionando y información básica.

### 2. Variables de Entorno
```
GET https://tu-app.onrender.com/api/debug/env
```
Muestra todas las variables de entorno relacionadas con la base de datos.

### 3. Test de Base de Datos
```
GET https://tu-app.onrender.com/api/debug/db-test
```
Intenta conectar a MySQL y ejecutar una consulta de prueba.

## 🚨 Problemas Comunes y Soluciones

### Problema: "Host: localhost" en los logs

**Síntoma**: Los logs muestran `Host: localhost` en lugar del host de Railway.

**Causa**: Las variables de entorno no están configuradas correctamente en Render.

**Solución**:
1. Ve al dashboard de Render
2. Selecciona tu aplicación
3. Ve a "Environment"
4. Verifica que estas variables estén configuradas:
   ```
   DB_HOST=tu-host-de-railway.railway.app
   DB_USER=root
   DB_PASSWORD=tu-password-de-railway
   DB_NAME=railway
   DB_PORT=3306
   ```

### Problema: Connection refused

**Síntoma**: Error ECONNREFUSED

**Posibles causas y soluciones**:

1. **Host incorrecto**:
   - Usar la URL `/api/debug/env` para verificar qué host se está usando
   - Debe ser el host público de Railway, no localhost

2. **Base de datos no accesible**:
   - Verificar que la base de datos de Railway esté activa
   - Comprobar que Railway permite conexiones externas

3. **Credenciales incorrectas**:
   - Usar `/api/debug/db-test` para ver el error específico
   - Verificar usuario y contraseña en Railway

## 📝 Pasos de Debugging

### Paso 1: Verificar Estado de la App
```bash
curl https://tu-app.onrender.com/api/debug/status
```

### Paso 2: Verificar Variables de Entorno
```bash
curl https://tu-app.onrender.com/api/debug/env
```

**✅ Variables correctas**:
```json
{
  "DATABASE_INFO": {
    "DB_HOST": "containers-us-west-xxx.railway.app",
    "DB_USER": "root",
    "DB_PASSWORD": "[DEFINIDA]",
    "DB_NAME": "railway",
    "DB_PORT": "3306"
  }
}
```

**❌ Variables incorrectas**:
```json
{
  "DATABASE_INFO": {
    "DB_HOST": "no definido",
    "DB_USER": "no definido",
    "DB_PASSWORD": "no definida",
    "DB_NAME": "no definido",
    "DB_PORT": "no definido"
  }
}
```

### Paso 3: Test de Conexión a BD
```bash
curl https://tu-app.onrender.com/api/debug/db-test
```

**✅ Conexión exitosa**:
```json
{
  "success": true,
  "message": "Conexión a base de datos exitosa",
  "data": {
    "test_result": {
      "test": 1,
      "current_time": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**❌ Error de conexión**:
```json
{
  "success": false,
  "error": "Error de conexión a base de datos",
  "details": {
    "message": "connect ECONNREFUSED 127.0.0.1:3306",
    "code": "ECONNREFUSED"
  }
}
```

## 🔧 Configuración Render + Railway

### En Railway:
1. Crear base de datos MySQL
2. Copiar las credenciales de conexión
3. Asegurarse de que permite conexiones externas

### En Render:
1. Environment Variables:
   ```
   NODE_ENV=production
   DB_HOST=containers-us-west-xxx.railway.app
   DB_USER=root
   DB_PASSWORD=tu_password_aqui
   DB_NAME=railway
   DB_PORT=3306
   ```

2. Build Command: `npm install`
3. Start Command: `npm start`

## 📞 Contacto de Soporte

Si los problemas persisten después de seguir estos pasos:

1. Revisar logs de Render para errores específicos
2. Verificar logs de Railway para actividad de conexión
3. Usar las rutas de debug para información detallada

## 🎯 URLs de Ejemplo

Reemplaza `tu-app` con el nombre real de tu aplicación en Render:

- Estado: `https://tu-app.onrender.com/api/debug/status`
- Variables: `https://tu-app.onrender.com/api/debug/env`  
- DB Test: `https://tu-app.onrender.com/api/debug/db-test`
- App Principal: `https://tu-app.onrender.com`

---

**Nota**: Las rutas de debug están disponibles tanto en desarrollo como en producción para facilitar el troubleshooting.
