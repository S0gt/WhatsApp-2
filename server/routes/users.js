const express = require('express');
const { pool } = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'whatsapp2_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Obtener perfil del usuario actual
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, username, email, profile_picture, status_message, 
       theme_preference, custom_background, privacy_settings, 
       created_at, is_online, last_seen 
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    // Parsear JSON de configuraciones de privacidad
    if (user.privacy_settings) {
      user.privacy_settings = JSON.parse(user.privacy_settings);
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar perfil del usuario
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, status_message, theme_preference, custom_background, privacy_settings } = req.body;
    const userId = req.user.userId;

    // Verificar si el username ya existe (si se está cambiando)
    if (username) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Ese nombre de usuario ya está en uso' });
      }
    }

    // Construir query dinámico
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (status_message !== undefined) {
      updates.push('status_message = ?');
      values.push(status_message);
    }
    if (theme_preference) {
      updates.push('theme_preference = ?');
      values.push(theme_preference);
    }
    if (custom_background !== undefined) {
      updates.push('custom_background = ?');
      values.push(custom_background);
    }
    if (privacy_settings) {
      updates.push('privacy_settings = ?');
      values.push(JSON.stringify(privacy_settings));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay datos para actualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener lista de usuarios en línea
router.get('/online', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, username, profile_picture, status_message, last_seen 
       FROM users 
       WHERE is_online = TRUE AND id != ? 
       ORDER BY last_seen DESC`,
      [req.user.userId]
    );

    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios en línea:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Buscar usuarios
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'La búsqueda debe tener al menos 2 caracteres' });
    }

    const [users] = await pool.execute(
      `SELECT id, username, profile_picture, status_message, is_online 
       FROM users 
       WHERE (username LIKE ? OR email LIKE ?) AND id != ?
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, req.user.userId]
    );

    res.json(users);
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener perfil de otro usuario
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await pool.execute(
      `SELECT id, username, profile_picture, status_message, 
       created_at, is_online, last_seen 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
