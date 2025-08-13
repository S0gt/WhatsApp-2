// chat.js - Manejo de chat en tiempo real

class ChatManager {
  constructor(authManager) {
    this.auth = authManager;
    this.socket = null;
    this.currentRoom = null;
    this.currentChatType = null; // 'room' o 'private'
    this.currentPrivateChat = null;
    this.apiUrl = '/api';
    
    this.initializeSocket();
  }

  // Inicializar Socket.IO
  initializeSocket() {
    this.socket = io();

    // Eventos de conexión
    this.socket.on('connect', () => {
      console.log('Conectado al servidor');
      if (this.auth.user) {
        this.socket.emit('join', this.auth.user);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
    });

    // Eventos de chat
    this.socket.on('new_message', (message) => {
      if (this.currentChatType === 'room' && this.currentRoom == message.roomId) {
        this.displayMessage(message);
      }
    });

    this.socket.on('new_private_message', (message) => {
      if (this.currentChatType === 'private') {
        this.displayMessage(message);
      }
      this.updatePrivateChats();
    });

    this.socket.on('user_typing', (data) => {
      this.showTypingIndicator(data);
    });

    this.socket.on('user_joined', (user) => {
      this.updateOnlineUsers();
    });

    this.socket.on('user_left', (user) => {
      this.updateOnlineUsers();
    });
  }

  // Cargar salas públicas
  async loadRooms() {
    try {
      const response = await fetch(`${this.apiUrl}/chats/rooms`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const rooms = await response.json();
        this.displayRooms(rooms);
      }
    } catch (error) {
      console.error('Error cargando salas:', error);
    }
  }

  // Mostrar salas en el UI
  displayRooms(rooms) {
    const container = document.getElementById('roomsContainer');
    container.innerHTML = '';

    rooms.forEach(room => {
      const roomElement = document.createElement('div');
      roomElement.className = 'room-item';
      roomElement.dataset.roomId = room.id;
      
      roomElement.innerHTML = `
        <div class="room-info">
          <div class="room-name">${room.name}</div>
          <div class="room-description">${room.description || 'Sin descripción'}</div>
        </div>
        <div class="room-participants">${room.participant_count || 0}</div>
      `;

      roomElement.addEventListener('click', () => {
        this.joinRoom(room.id, room.name, room.description);
      });

      container.appendChild(roomElement);
    });
  }

  // Unirse a una sala
  async joinRoom(roomId, roomName, description) {
    try {
      // Unirse a la sala en el backend
      const response = await fetch(`${this.apiUrl}/chats/rooms/${roomId}/join`, {
        method: 'POST',
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok || response.status === 400) { // 400 si ya es miembro
        // Cambiar sala actual
        this.currentRoom = roomId;
        this.currentChatType = 'room';
        this.currentPrivateChat = null;

        // Unirse a la sala en Socket.IO
        this.socket.emit('join_room', roomId);

        // Actualizar UI
        this.updateChatHeader(roomName, description);
        this.markRoomAsActive(roomId);
        
        // Cargar mensajes
        this.loadRoomMessages(roomId);
        
        // Habilitar entrada de mensajes
        this.enableMessageInput();
      }
    } catch (error) {
      console.error('Error uniéndose a sala:', error);
    }
  }

  // Cargar mensajes de una sala
  async loadRoomMessages(roomId) {
    try {
      const response = await fetch(`${this.apiUrl}/chats/rooms/${roomId}/messages`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const messages = await response.json();
        this.displayMessages(messages);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  }

  // Cargar chats privados
  async loadPrivateChats() {
    try {
      const response = await fetch(`${this.apiUrl}/chats/private`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const chats = await response.json();
        this.displayPrivateChats(chats);
      }
    } catch (error) {
      console.error('Error cargando chats privados:', error);
    }
  }

  // Mostrar chats privados
  displayPrivateChats(chats) {
    const container = document.getElementById('privateContainer');
    container.innerHTML = '';

    if (chats.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No tienes chats privados aún</p>
          <p>Ve a "Usuarios" para iniciar una conversación</p>
        </div>
      `;
      return;
    }

    chats.forEach(chat => {
      const chatElement = document.createElement('div');
      chatElement.className = 'private-item';
      chatElement.dataset.chatId = chat.chat_id;
      
      chatElement.innerHTML = `
        <div class="avatar">
          ${chat.other_profile_picture 
            ? `<img src="${chat.other_profile_picture}" alt="${chat.other_username}">` 
            : `<i class="fas fa-user"></i>`}
          ${chat.other_is_online ? '<div class="online-indicator"></div>' : ''}
        </div>
        <div class="private-info">
          <div class="private-name">${chat.other_username}</div>
          <div class="private-last-message">${chat.last_message || 'Sin mensajes'}</div>
        </div>
      `;

      chatElement.addEventListener('click', () => {
        this.openPrivateChat(chat.chat_id, chat.other_user_id, chat.other_username);
      });

      container.appendChild(chatElement);
    });
  }

  // Abrir chat privado
  async openPrivateChat(chatId, otherUserId, otherUsername) {
    this.currentRoom = null;
    this.currentChatType = 'private';
    this.currentPrivateChat = { chatId, otherUserId, otherUsername };

    // Actualizar UI
    this.updateChatHeader(otherUsername, 'Chat privado');
    this.markPrivateChatAsActive(chatId);
    
    // Cargar mensajes
    this.loadPrivateMessages(chatId);
    
    // Habilitar entrada de mensajes
    this.enableMessageInput();
  }

  // Cargar mensajes privados
  async loadPrivateMessages(chatId) {
    try {
      const response = await fetch(`${this.apiUrl}/chats/private/${chatId}/messages`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const messages = await response.json();
        this.displayMessages(messages);
      }
    } catch (error) {
      console.error('Error cargando mensajes privados:', error);
    }
  }

  // Mostrar mensajes en el UI
  displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    messages.forEach(message => {
      this.displayMessage(message);
    });

    // Scroll al final
    container.scrollTop = container.scrollHeight;
  }

  // Mostrar un mensaje individual
  displayMessage(message) {
    const container = document.getElementById('messagesContainer');
    
    // Remover mensaje de bienvenida si existe
    const welcomeMessage = container.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    const messageElement = document.createElement('div');
    const isOwn = message.user_id === this.auth.user.id;
    
    messageElement.className = `message ${isOwn ? 'own' : 'other'}`;
    
    let messageContent = '';
    
    if (message.message_type === 'text') {
      messageContent = `<div class="message-content">${this.escapeHtml(message.message_text)}</div>`;
    } else {
      // Archivo adjunto
      messageContent = `
        <div class="message-content">${message.message_text || ''}</div>
        <div class="message-file">
          <div class="file-icon">
            <i class="fas fa-${this.getFileIcon(message.message_type)}"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${message.file_name}</div>
            <div class="file-size">${this.formatFileSize(message.file_size)}</div>
          </div>
          <a href="${message.file_path}" target="_blank" class="file-download">
            <i class="fas fa-download"></i>
          </a>
        </div>
      `;
    }

    messageElement.innerHTML = `
      ${!isOwn ? `
        <div class="message-header">
          <div class="message-avatar">
            ${message.profile_picture 
              ? `<img src="${message.profile_picture}" alt="${message.username}">` 
              : `<i class="fas fa-user"></i>`}
          </div>
          <span class="message-author">${message.username}</span>
          <span class="message-time">${this.formatTime(message.created_at)}</span>
        </div>
      ` : ''}
      ${messageContent}
      ${isOwn ? `
        <div class="message-time">${this.formatTime(message.created_at)}</div>
      ` : ''}
    `;

    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
  }

  // Enviar mensaje
  async sendMessage(text, type = 'text', file = null) {
    if (!text.trim() && !file) return;

    const messageData = {
      message_text: text,
      message_type: type,
      user: this.auth.user
    };

    if (this.currentChatType === 'room' && this.currentRoom) {
      // Mensaje a sala
      messageData.roomId = this.currentRoom;
      
      try {
        const response = await fetch(`${this.apiUrl}/chats/rooms/${this.currentRoom}/messages`, {
          method: 'POST',
          headers: this.auth.getAuthHeaders(),
          body: JSON.stringify({
            message_text: text,
            message_type: type
          })
        });

        if (response.ok) {
          // Obtener el mensaje guardado del servidor y mostrarlo inmediatamente
          const savedMessage = await response.json();
          this.displayMessage(savedMessage);
          
          // Enviar por Socket.IO para otros usuarios
          this.socket.emit('send_message', messageData);
        }
      } catch (error) {
        console.error('Error enviando mensaje:', error);
      }
    } else if (this.currentChatType === 'private' && this.currentPrivateChat) {
      // Mensaje privado
      messageData.recipientId = this.currentPrivateChat.otherUserId;
      messageData.from = this.auth.user;

      try {
        const response = await fetch(`${this.apiUrl}/chats/private/${this.currentPrivateChat.chatId}/messages`, {
          method: 'POST',
          headers: this.auth.getAuthHeaders(),
          body: JSON.stringify({
            message_text: text,
            message_type: type
          })
        });

        if (response.ok) {
          this.socket.emit('private_message', messageData);
          // Mostrar mensaje localmente
          const newMessage = await response.json();
          this.displayMessage(newMessage);
        }
      } catch (error) {
        console.error('Error enviando mensaje privado:', error);
      }
    }
  }

  // Cargar usuarios en línea
  async loadOnlineUsers() {
    try {
      const response = await fetch(`${this.apiUrl}/users/online`, {
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const users = await response.json();
        this.displayUsers(users);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  // Mostrar usuarios
  displayUsers(users) {
    const container = document.getElementById('usersContainer');
    container.innerHTML = '';

    if (users.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay usuarios en línea</p>
        </div>
      `;
      return;
    }

    users.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'user-item';
      
      userElement.innerHTML = `
        <div class="avatar">
          ${user.profile_picture 
            ? `<img src="${user.profile_picture}" alt="${user.username}">` 
            : `<i class="fas fa-user"></i>`}
          <div class="online-indicator"></div>
        </div>
        <div class="user-info-item">
          <div class="user-name">${user.username}</div>
          <div class="user-status">${user.status_message || 'En línea'}</div>
        </div>
      `;

      userElement.addEventListener('click', () => {
        this.startPrivateChat(user.id, user.username);
      });

      container.appendChild(userElement);
    });
  }

  // Iniciar chat privado
  async startPrivateChat(userId, username) {
    try {
      const response = await fetch(`${this.apiUrl}/chats/private/${userId}`, {
        method: 'POST',
        headers: this.auth.getAuthHeaders()
      });

      if (response.ok) {
        const chatData = await response.json();
        this.openPrivateChat(chatData.chat_id, userId, username);
        
        // Cambiar a la pestaña de chats privados
        document.querySelector('[data-tab="private"]').click();
      }
    } catch (error) {
      console.error('Error iniciando chat privado:', error);
    }
  }

  // Funciones de utilidad
  updateChatHeader(name, description) {
    document.getElementById('currentChatName').textContent = name;
    document.getElementById('currentChatDescription').textContent = description;
  }

  markRoomAsActive(roomId) {
    // Remover clase activa de todos los items
    document.querySelectorAll('.room-item, .private-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Marcar sala como activa
    const roomItem = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomItem) {
      roomItem.classList.add('active');
    }
  }

  markPrivateChatAsActive(chatId) {
    // Remover clase activa de todos los items
    document.querySelectorAll('.room-item, .private-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Marcar chat como activo
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
      chatItem.classList.add('active');
    }
  }

  enableMessageInput() {
    const input = document.getElementById('messageInput');
    const button = document.getElementById('sendBtn');
    
    input.disabled = false;
    input.placeholder = 'Escribe tu mensaje...';
    button.disabled = false;
  }

  showTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    const text = document.getElementById('typingText');
    
    if (data.isTyping) {
      text.textContent = `${data.user.username} está escribiendo...`;
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }

  updateOnlineUsers() {
    if (document.querySelector('[data-tab="users"]').classList.contains('active')) {
      this.loadOnlineUsers();
    }
  }

  updatePrivateChats() {
    this.loadPrivateChats();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type) {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'video';
      case 'audio': return 'music';
      case 'document': return 'file-alt';
      default: return 'file';
    }
  }
}

// Exportar para uso global
window.ChatManager = ChatManager;
