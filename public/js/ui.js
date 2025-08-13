// ui.js - Manejo de interfaz de usuario

class UIManager {
  constructor(authManager, chatManager) {
    this.auth = authManager;
    this.chat = chatManager;
    this.currentTheme = localStorage.getItem('whatsapp2_theme') || 'light';
    
    this.initializeUI();
    this.applyTheme();
  }

  initializeUI() {
    this.initializeTabNavigation();
    this.initializeMessageInput();
    this.initializeFileUpload();
    this.initializeSettings();
    this.initializeNotifications();
    this.initializeUserProfile();
  }

  // Navegación de pestañas
  initializeTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Botones de refresh
    document.getElementById('refreshRooms').addEventListener('click', () => {
      this.chat.loadRooms();
    });

    document.getElementById('refreshPrivate').addEventListener('click', () => {
      this.chat.loadPrivateChats();
    });

    document.getElementById('refreshUsers').addEventListener('click', () => {
      this.chat.loadOnlineUsers();
    });

    // Búsqueda de usuarios
    const searchInput = document.getElementById('userSearch');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.searchUsers(e.target.value);
      }, 300);
    });
  }

  switchTab(tabName) {
    // Actualizar tabs activos
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Mostrar contenido correspondiente
    document.querySelectorAll('.content-list').forEach(list => {
      list.classList.remove('active');
    });
    document.getElementById(`${tabName}List`).classList.add('active');

    // Cargar datos según la pestaña
    switch (tabName) {
      case 'rooms':
        this.chat.loadRooms();
        break;
      case 'private':
        this.chat.loadPrivateChats();
        break;
      case 'users':
        this.chat.loadOnlineUsers();
        break;
    }
  }

  // Entrada de mensajes
  initializeMessageInput() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // Enviar mensaje con Enter
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendCurrentMessage();
      }
    });

    // Enviar mensaje con botón
    sendBtn.addEventListener('click', () => {
      this.sendCurrentMessage();
    });

    // Indicador de escritura
    let typingTimeout;
    input.addEventListener('input', () => {
      if (this.chat.currentRoom && this.chat.currentChatType === 'room') {
        this.chat.socket.emit('typing', {
          roomId: this.chat.currentRoom,
          user: this.auth.user,
          isTyping: true
        });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          this.chat.socket.emit('typing', {
            roomId: this.chat.currentRoom,
            user: this.auth.user,
            isTyping: false
          });
        }, 1000);
      }
    });
  }

  sendCurrentMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (text) {
      this.chat.sendMessage(text);
      input.value = '';
    }
  }

  // Subida de archivos
  initializeFileUpload() {
    const fileBtn = document.getElementById('fileBtn');
    const fileInput = document.getElementById('fileInput');

    fileBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        this.handleFileUpload(files);
      }
    });

    // Drag and drop
    const messagesContainer = document.getElementById('messagesContainer');
    
    messagesContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      messagesContainer.classList.add('drag-over');
    });

    messagesContainer.addEventListener('dragleave', () => {
      messagesContainer.classList.remove('drag-over');
    });

    messagesContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      messagesContainer.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        this.handleFileUpload(files);
      }
    });
  }

  async handleFileUpload(files) {
    for (const file of files) {
      await this.uploadFile(file);
    }
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      this.showUploadProgress(file.name, 0);

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.auth.token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        this.hideUploadProgress();
        
        // Enviar mensaje con archivo
        await this.chat.sendMessage(
          `📎 ${file.name}`,
          result.file.category,
          result.file
        );
        
        this.showNotification('Archivo enviado correctamente', 'success');
      } else {
        throw new Error('Error subiendo archivo');
      }
    } catch (error) {
      this.hideUploadProgress();
      this.showNotification('Error subiendo archivo', 'error');
      console.error('Error:', error);
    }
  }

  showUploadProgress(filename, progress) {
    // Implementar barra de progreso si es necesario
    this.showNotification(`Subiendo ${filename}...`, 'info');
  }

  hideUploadProgress() {
    // Ocultar barra de progreso
  }

  // Configuraciones
  initializeSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const saveSettings = document.getElementById('saveSettings');

    settingsBtn.addEventListener('click', () => {
      this.showSettings();
    });

    closeSettings.addEventListener('click', () => {
      this.hideSettings();
    });

    saveSettings.addEventListener('click', () => {
      this.saveSettings();
    });

    // Subida de avatar
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');

    uploadAvatarBtn.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.uploadAvatar(e.target.files[0]);
      }
    });

    // Cambio de tema
    const themeSelect = document.getElementById('themeSelect');
    themeSelect.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.logout();
    });
  }

  showSettings() {
    const modal = document.getElementById('settingsModal');
    
    // Cargar datos actuales
    if (this.auth.user) {
      document.getElementById('settingsUsername').value = this.auth.user.username || '';
      document.getElementById('settingsStatus').value = this.auth.user.status_message || '';
      document.getElementById('themeSelect').value = this.auth.user.theme_preference || 'light';
      
      if (this.auth.user.profile_picture) {
        const currentAvatar = document.getElementById('currentAvatar');
        currentAvatar.innerHTML = `<img src="${this.auth.user.profile_picture}" alt="Avatar">`;
      }
    }

    modal.classList.remove('hidden');
  }

  hideSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
  }

  async saveSettings() {
    const username = document.getElementById('settingsUsername').value;
    const status = document.getElementById('settingsStatus').value;
    const theme = document.getElementById('themeSelect').value;

    const profileData = {};
    if (username !== this.auth.user.username) profileData.username = username;
    if (status !== this.auth.user.status_message) profileData.status_message = status;
    if (theme !== this.auth.user.theme_preference) profileData.theme_preference = theme;

    if (Object.keys(profileData).length > 0) {
      const result = await this.auth.updateProfile(profileData);
      
      if (result.success) {
        this.showNotification('Configuración guardada', 'success');
        this.updateUserProfile();
        this.applyTheme(theme);
        this.hideSettings();
      } else {
        this.showNotification(result.error, 'error');
      }
    } else {
      this.hideSettings();
    }
  }

  async uploadAvatar(file) {
    const result = await this.auth.uploadProfilePicture(file);
    
    if (result.success) {
      this.showNotification('Foto de perfil actualizada', 'success');
      this.updateUserProfile();
      
      // Actualizar avatar en configuraciones
      const currentAvatar = document.getElementById('currentAvatar');
      currentAvatar.innerHTML = `<img src="${result.data.profilePicture}" alt="Avatar">`;
    } else {
      this.showNotification(result.error, 'error');
    }
  }

  // Tema
  applyTheme(theme = this.currentTheme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('whatsapp2_theme', theme);
  }

  // Perfil de usuario
  initializeUserProfile() {
    this.updateUserProfile();
  }

  updateUserProfile() {
    if (!this.auth.user) return;

    const userName = document.getElementById('userName');
    const userStatus = document.getElementById('userStatus');
    const userAvatar = document.getElementById('userAvatar');

    userName.textContent = this.auth.user.username;
    userStatus.textContent = this.auth.user.status_message || 'En línea';

    if (this.auth.user.profile_picture) {
      userAvatar.innerHTML = `<img src="${this.auth.user.profile_picture}" alt="${this.auth.user.username}">`;
    } else {
      userAvatar.innerHTML = '<i class="fas fa-user"></i>';
    }
  }

  // Búsqueda de usuarios
  async searchUsers(query) {
    if (!query || query.length < 2) {
      this.chat.loadOnlineUsers();
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const users = await response.json();
        this.chat.displayUsers(users);
      }
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    }
  }

  // Notificaciones
  initializeNotifications() {
    // Las notificaciones se manejan a través de showNotification
  }

  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
      <div class="notification-title">${this.getNotificationTitle(type)}</div>
      <div class="notification-message">${message}</div>
    `;

    container.appendChild(notification);

    // Auto-remover después del tiempo especificado
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            container.removeChild(notification);
          }
        }, 300);
      }
    }, duration);

    // Permitir cerrar haciendo clic
    notification.addEventListener('click', () => {
      if (notification.parentNode) {
        container.removeChild(notification);
      }
    });
  }

  getNotificationTitle(type) {
    switch (type) {
      case 'success': return '✅ Éxito';
      case 'error': return '❌ Error';
      case 'warning': return '⚠️ Advertencia';
      default: return 'ℹ️ Información';
    }
  }

  // Logout
  async logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await this.auth.logout();
      window.location.reload();
    }
  }

  // Utilidades
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Hacer disponible globalmente
window.UIManager = UIManager;
window.showNotification = function(message, type, duration) {
  if (window.uiManager) {
    window.uiManager.showNotification(message, type, duration);
  }
};
