// auth.js - Manejo de autenticación

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('whatsapp2_token');
    this.user = null;
    this.apiUrl = '/api';
  }

  // Verificar si el usuario está autenticado
  async isAuthenticated() {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.apiUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      this.clearAuth();
      return false;
    }
  }

  // Registrar nuevo usuario
  async register(userData) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('whatsapp2_token', this.token);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Iniciar sesión
  async login(credentials) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('whatsapp2_token', this.token);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Cerrar sesión
  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Limpiar datos de autenticación
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('whatsapp2_token');
  }

  // Obtener headers de autorización
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Obtener perfil del usuario
  async getProfile() {
    try {
      const response = await fetch(`${this.apiUrl}/users/profile`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const userData = await response.json();
        this.user = userData;
        return { success: true, data: userData };
      } else {
        return { success: false, error: 'Error obteniendo perfil' };
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Actualizar perfil
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.apiUrl}/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar datos locales
        Object.assign(this.user, profileData);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  // Subir foto de perfil
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`${this.apiUrl}/upload/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar foto de perfil local
        this.user.profile_picture = data.profilePicture;
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error subiendo foto de perfil:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
}

// Manejo de formularios de autenticación
class AuthUI {
  constructor(authManager) {
    this.auth = authManager;
    this.initializeEvents();
  }

  initializeEvents() {
    // Cambiar entre login y registro
    document.getElementById('showRegister').addEventListener('click', (e) => {
      e.preventDefault();
      this.showRegisterForm();
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    // Formularios
    document.getElementById('loginFormElement').addEventListener('submit', (e) => {
      this.handleLogin(e);
    });

    document.getElementById('registerFormElement').addEventListener('submit', (e) => {
      this.handleRegister(e);
    });
  }

  showLoginForm() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
  }

  showRegisterForm() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      this.showError('Por favor completa todos los campos');
      return;
    }

    this.showLoading(true);

    const result = await this.auth.login({ email, password });

    this.showLoading(false);

    if (result.success) {
      this.showSuccess('¡Bienvenido de vuelta!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      this.showError(result.error);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!username || !email || !password) {
      this.showError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      this.showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.showLoading(true);

    const result = await this.auth.register({ username, email, password });

    this.showLoading(false);

    if (result.success) {
      this.showSuccess('¡Cuenta creada exitosamente!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      this.showError(result.error);
    }
  }

  showLoading(show) {
    const buttons = document.querySelectorAll('.auth-form button[type="submit"]');
    buttons.forEach(btn => {
      if (show) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
      } else {
        btn.disabled = false;
        const isLogin = btn.closest('#loginForm');
        btn.innerHTML = isLogin 
          ? '<i class="fas fa-sign-in-alt"></i> Entrar'
          : '<i class="fas fa-user-plus"></i> Registrarse';
      }
    });
  }

  showError(message) {
    // Reutilizar el sistema de notificaciones si existe
    if (window.showNotification) {
      window.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }
}

// Exportar para uso global
window.AuthManager = AuthManager;
window.AuthUI = AuthUI;
