// app.js - Punto de entrada principal de la aplicación

class SuperChatApp {
  constructor() {
    this.authManager = null;
    this.chatManager = null;
    this.uiManager = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 Iniciando SuperChat...');
    
    // Inicializar gestor de autenticación
    this.authManager = new AuthManager();
    
    // Verificar si el usuario está autenticado
    const isAuthenticated = await this.authManager.isAuthenticated();
    
    if (isAuthenticated) {
      console.log('✅ Usuario autenticado:', this.authManager.user);
      this.showChatApp();
    } else {
      console.log('❌ Usuario no autenticado');
      this.showAuthScreen();
    }
  }

  showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('chatApp').classList.add('hidden');
    
    // Inicializar UI de autenticación
    new AuthUI(this.authManager);
  }

  showChatApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('chatApp').classList.remove('hidden');
    
    // Inicializar managers principales
    this.chatManager = new ChatManager(this.authManager);
    this.uiManager = new UIManager(this.authManager, this.chatManager);
    
    // Hacer disponibles globalmente para depuración
    window.authManager = this.authManager;
    window.chatManager = this.chatManager;
    window.uiManager = this.uiManager;
    
    // Cargar datos iniciales
    this.loadInitialData();
    
    console.log('✅ SuperChat iniciado correctamente');
  }

  async loadInitialData() {
    try {
      // Cargar perfil completo del usuario
      await this.authManager.getProfile();
      
      // Actualizar UI con datos del usuario
      this.uiManager.updateUserProfile();
      
      // Cargar salas por defecto
      await this.chatManager.loadRooms();
      
      console.log('📊 Datos iniciales cargados');
      
      // Mostrar mensaje de bienvenida
      this.uiManager.showNotification(
        `¡Bienvenido de vuelta, ${this.authManager.user.username}!`,
        'success'
      );

      // Inicializar conexión a base de datos del servidor
      this.initializeServerConnection();
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.uiManager.showNotification(
        'Error cargando datos de la aplicación',
        'error'
      );
    }
  }

  async initializeServerConnection() {
    try {
      // Verificar que el servidor backend esté funcionando
      const response = await fetch('/api/users/profile', {
        headers: this.authManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Servidor no disponible');
      }

      console.log('🔗 Conexión con servidor establecida');
      
    } catch (error) {
      console.error('Error conectando con servidor:', error);
      this.uiManager.showNotification(
        'Problemas de conexión con el servidor',
        'warning'
      );
    }
  }

  // Método para reiniciar la aplicación
  restart() {
    window.location.reload();
  }

  // Método para obtener estadísticas de la aplicación
  getStats() {
    return {
      authenticated: !!this.authManager?.user,
      user: this.authManager?.user?.username,
      currentRoom: this.chatManager?.currentRoom,
      currentChatType: this.chatManager?.currentChatType,
      socketConnected: this.chatManager?.socket?.connected,
      theme: this.uiManager?.currentTheme
    };
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM cargado, iniciando SuperChat...');
  
  // Crear instancia principal de la aplicación
  window.superChatApp = new SuperChatApp();
});

// Manejo de errores globales
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error);
  
  if (window.uiManager) {
    window.uiManager.showNotification(
      'Ha ocurrido un error inesperado',
      'error'
    );
  }
});

// Manejo de errores de promesas no capturadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason);
  
  if (window.uiManager) {
    window.uiManager.showNotification(
      'Error de conexión',
      'warning'
    );
  }
});

// Prevenir cierre accidental de la página
window.addEventListener('beforeunload', (event) => {
  if (window.authManager?.user && window.chatManager?.socket?.connected) {
    event.preventDefault();
    event.returnValue = '¿Estás seguro de que quieres salir de SuperChat?';
    return event.returnValue;
  }
});

// Funciones de utilidad globales
window.SuperChatUtils = {
  // Formatear tiempo
  formatTime: (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  // Formatear fecha
  formatDate: (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Formatear tamaño de archivo
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Escapar HTML
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Generar ID único
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Validar email
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Detectar tipo de archivo
  getFileType: (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    
    return 'document';
  }
};

console.log('📋 SuperChat App cargado - Versión 1.0.0');
