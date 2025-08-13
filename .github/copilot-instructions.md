# Instrucciones para Copilot - SuperChat

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Descripción del Proyecto

SuperChat es una aplicación de chat en tiempo real inspirada en chatgratis.net. Es un proyecto completo con autenticación, chat en tiempo real, subida de archivos y personalización de usuario.

## Tecnologías Principales

- **Backend**: Node.js, Express.js, Socket.IO, MySQL
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Base de datos**: MySQL con tablas relacionales
- **Autenticación**: JWT con bcrypt para contraseñas
- **Tiempo real**: Socket.IO para comunicación bidireccional
- **Archivos**: Multer para manejo de uploads

## Estructura de Archivos

### Backend (`/server`)
- `app.js` - Servidor principal con Express y Socket.IO
- `db.js` - Configuración y conexión a MySQL
- `routes/` - Rutas organizadas por funcionalidad
  - `auth.js` - Autenticación (login, registro, logout)
  - `users.js` - Gestión de usuarios y perfiles
  - `chats.js` - Salas públicas y chats privados
  - `uploads.js` - Subida y gestión de archivos

### Frontend (`/public`)
- `index.html` - SPA con todas las vistas
- `css/style.css` - Estilos con variables CSS y temas
- `js/` - Arquitectura modular
  - `app.js` - Aplicación principal y punto de entrada
  - `auth.js` - Gestión de autenticación del cliente
  - `chat.js` - Manejo de chat y Socket.IO
  - `ui.js` - Interfaz de usuario y interacciones

## Convenciones de Código

### JavaScript
- Usar ES6+ (clases, arrow functions, async/await)
- Nombres de clases en PascalCase
- Nombres de métodos y variables en camelCase
- Comentarios en español para funciones importantes
- Manejo de errores con try/catch

### CSS
- Variables CSS para temas (`:root`)
- Nomenclatura BEM para clases complejas
- Flexbox para layouts
- Media queries para responsividad
- Transiciones suaves (0.2s ease)

### Base de Datos
- Tablas en inglés, snake_case
- Índices para optimización
- Claves foráneas con CASCADE/SET NULL
- Timestamps automáticos
- JSON para configuraciones complejas

## Patrones de Diseño

### Frontend
- **Clase Manager**: AuthManager, ChatManager, UIManager
- **Eventos centralizados**: Un manager por responsabilidad
- **Estado local**: Variables de instancia en managers
- **Comunicación**: Métodos públicos entre managers

### Backend
- **Middleware de autenticación**: Verificación JWT reutilizable
- **Rutas RESTful**: GET/POST/PUT/DELETE semánticos
- **Validación de entrada**: Siempre validar datos del cliente
- **Respuestas consistentes**: `{ success, data?, error? }`

## Funcionalidades Implementadas

1. **Sistema de autenticación completo**
   - Registro con validación
   - Login con JWT
   - Middleware de autorización
   - Gestión de sesiones

2. **Chat en tiempo real**
   - Salas públicas
   - Chats privados
   - Indicadores de escritura
   - Historial persistente

3. **Sistema de archivos**
   - Upload de múltiples tipos
   - Organización por categorías
   - Límites de tamaño
   - Integración con mensajes

4. **Personalización**
   - Temas claro/oscuro
   - Perfiles de usuario
   - Estados personalizados
   - Fotos de perfil

## Guías para Desarrollo

### Agregar nueva funcionalidad
1. **Backend**: Crear ruta en `/server/routes/`
2. **Base de datos**: Actualizar esquema si es necesario
3. **Frontend**: Agregar método al manager correspondiente
4. **UI**: Actualizar interfaz y eventos

### Manejo de errores
- Backend: Logs detallados + respuesta genérica al cliente
- Frontend: Notificaciones usuario-friendly
- Base de datos: Transacciones para operaciones críticas

### Testing
- Probar rutas con herramientas como Postman
- Verificar autenticación en todas las rutas protegidas
- Comprobar validación de entrada
- Testear Socket.IO events

### Seguridad
- Nunca exponer contraseñas en logs
- Validar y sanitizar todas las entradas
- Usar HTTPS en producción
- Configurar CORS apropiadamente

## Variables de Entorno Importantes

```env
NODE_ENV=development|production
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=superchat
JWT_SECRET=your-secret-key
```

## Comandos Útiles

```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
npm install      # Instalar dependencias
```

## Notas Específicas

- Las contraseñas se hashean con bcrypt (10 rounds)
- Los archivos se organizan por tipo en `/uploads/`
- Socket.IO maneja reconexión automática
- CSS usa variables para facilitar temas
- La app es SPA (Single Page Application)
- MySQL se inicializa automáticamente con `db.js`

## Próximas Características a Implementar

- Sistema de notificaciones push
- Moderación de salas
- Emojis y reacciones
- Búsqueda de mensajes
- Configuraciones avanzadas de privacidad

Cuando trabajes en este proyecto, mantén la consistencia con estos patrones y estructura. El código debe ser limpio, bien comentado y seguir las convenciones establecidas.
