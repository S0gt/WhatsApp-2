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

// Obtener salas públicas
router.get('/rooms', verifyToken, async (req, res) => {
  try {
    const [rooms] = await pool.execute(
      `SELECT r.id, r.name, r.description, r.created_at,
       u.username as creator_name,
       COUNT(rp.user_id) as participant_count
       FROM rooms r
       LEFT JOIN users u ON r.created_by = u.id
       LEFT JOIN room_participants rp ON r.id = rp.room_id
       WHERE r.is_public = TRUE
       GROUP BY r.id, r.name, r.description, r.created_at, u.username
       ORDER BY participant_count DESC, r.created_at DESC`
    );

    res.json(rooms);
  } catch (error) {
    console.error('Error obteniendo salas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Unirse a una sala
router.post('/rooms/:roomId/join', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    // Verificar si la sala existe y es pública
    const [rooms] = await pool.execute(
      'SELECT id, is_public FROM rooms WHERE id = ?',
      [roomId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }

    if (!rooms[0].is_public) {
      return res.status(403).json({ message: 'Esta sala es privada' });
    }

    // Verificar si ya es participante
    const [existingParticipant] = await pool.execute(
      'SELECT id FROM room_participants WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );

    if (existingParticipant.length > 0) {
      return res.status(400).json({ message: 'Ya eres participante de esta sala' });
    }

    // Unirse a la sala
    await pool.execute(
      'INSERT INTO room_participants (room_id, user_id) VALUES (?, ?)',
      [roomId, userId]
    );

    res.json({ message: 'Te has unido a la sala exitosamente' });
  } catch (error) {
    console.error('Error uniéndose a sala:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener mensajes de una sala
router.get('/rooms/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verificar si es participante de la sala
    const [participant] = await pool.execute(
      'SELECT id FROM room_participants WHERE room_id = ? AND user_id = ?',
      [roomId, req.user.userId]
    );

    if (participant.length === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta sala' });
    }

    const [messages] = await pool.execute(
      `SELECT m.id, m.message_text, m.message_type, m.file_path, m.file_name, 
       m.file_size, m.created_at,
       u.id as user_id, u.username, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.room_id = ? AND m.is_private = FALSE
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [roomId, parseInt(limit), parseInt(offset)]
    );

    res.json(messages.reverse()); // Invertir para mostrar más antiguos primero
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Enviar mensaje a sala
router.post('/rooms/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message_text, message_type = 'text' } = req.body;
    const userId = req.user.userId;

    // Verificar si es participante de la sala
    const [participant] = await pool.execute(
      'SELECT id FROM room_participants WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );

    if (participant.length === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta sala' });
    }

    // Guardar mensaje
    const [result] = await pool.execute(
      'INSERT INTO messages (user_id, room_id, message_text, message_type) VALUES (?, ?, ?, ?)',
      [userId, roomId, message_text, message_type]
    );

    // Obtener mensaje completo para respuesta
    const [newMessage] = await pool.execute(
      `SELECT m.id, m.message_text, m.message_type, m.created_at,
       u.id as user_id, u.username, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener chats privados del usuario
router.get('/private', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [chats] = await pool.execute(
      `SELECT pc.id as chat_id,
       CASE 
         WHEN pc.user1_id = ? THEN u2.id
         ELSE u1.id
       END as other_user_id,
       CASE 
         WHEN pc.user1_id = ? THEN u2.username
         ELSE u1.username
       END as other_username,
       CASE 
         WHEN pc.user1_id = ? THEN u2.profile_picture
         ELSE u1.profile_picture
       END as other_profile_picture,
       CASE 
         WHEN pc.user1_id = ? THEN u2.is_online
         ELSE u1.is_online
       END as other_is_online,
       pc.created_at,
       (SELECT m.message_text 
        FROM messages m 
        WHERE ((m.user_id = ? AND m.recipient_id = (CASE WHEN pc.user1_id = ? THEN u2.id ELSE u1.id END))
               OR (m.user_id = (CASE WHEN pc.user1_id = ? THEN u2.id ELSE u1.id END) AND m.recipient_id = ?))
        ORDER BY m.created_at DESC LIMIT 1) as last_message,
       (SELECT m.created_at 
        FROM messages m 
        WHERE ((m.user_id = ? AND m.recipient_id = (CASE WHEN pc.user1_id = ? THEN u2.id ELSE u1.id END))
               OR (m.user_id = (CASE WHEN pc.user1_id = ? THEN u2.id ELSE u1.id END) AND m.recipient_id = ?))
        ORDER BY m.created_at DESC LIMIT 1) as last_message_time
       FROM private_chats pc
       JOIN users u1 ON pc.user1_id = u1.id
       JOIN users u2 ON pc.user2_id = u2.id
       WHERE pc.user1_id = ? OR pc.user2_id = ?
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json(chats);
  } catch (error) {
    console.error('Error obteniendo chats privados:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear o obtener chat privado
router.post('/private/:otherUserId', verifyToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    if (userId == otherUserId) {
      return res.status(400).json({ message: 'No puedes crear un chat contigo mismo' });
    }

    // Verificar si el otro usuario existe
    const [otherUser] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [otherUserId]
    );

    if (otherUser.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si ya existe un chat entre estos usuarios
    const [existingChat] = await pool.execute(
      `SELECT id FROM private_chats 
       WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
      [userId, otherUserId, otherUserId, userId]
    );

    let chatId;
    if (existingChat.length > 0) {
      chatId = existingChat[0].id;
    } else {
      // Crear nuevo chat (siempre poner el ID menor primero)
      const [user1Id, user2Id] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
      const [result] = await pool.execute(
        'INSERT INTO private_chats (user1_id, user2_id) VALUES (?, ?)',
        [user1Id, user2Id]
      );
      chatId = result.insertId;
    }

    res.json({
      chat_id: chatId,
      other_user: otherUser[0]
    });
  } catch (error) {
    console.error('Error creando chat privado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener mensajes de chat privado
router.get('/private/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    // Verificar si el usuario es parte del chat
    const [chat] = await pool.execute(
      'SELECT user1_id, user2_id FROM private_chats WHERE id = ?',
      [chatId]
    );

    if (chat.length === 0) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    if (chat[0].user1_id != userId && chat[0].user2_id != userId) {
      return res.status(403).json({ message: 'No tienes acceso a este chat' });
    }

    const otherUserId = chat[0].user1_id == userId ? chat[0].user2_id : chat[0].user1_id;

    const [messages] = await pool.execute(
      `SELECT m.id, m.message_text, m.message_type, m.file_path, m.file_name, 
       m.file_size, m.created_at,
       u.id as user_id, u.username, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE ((m.user_id = ? AND m.recipient_id = ?) OR (m.user_id = ? AND m.recipient_id = ?))
       AND m.is_private = TRUE
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, otherUserId, otherUserId, userId, parseInt(limit), parseInt(offset)]
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error obteniendo mensajes privados:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Enviar mensaje privado
router.post('/private/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message_text, message_type = 'text' } = req.body;
    const userId = req.user.userId;

    // Verificar chat y obtener destinatario
    const [chat] = await pool.execute(
      'SELECT user1_id, user2_id FROM private_chats WHERE id = ?',
      [chatId]
    );

    if (chat.length === 0) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    if (chat[0].user1_id != userId && chat[0].user2_id != userId) {
      return res.status(403).json({ message: 'No tienes acceso a este chat' });
    }

    const recipientId = chat[0].user1_id == userId ? chat[0].user2_id : chat[0].user1_id;

    // Guardar mensaje
    const [result] = await pool.execute(
      'INSERT INTO messages (user_id, recipient_id, message_text, message_type, is_private) VALUES (?, ?, ?, ?, TRUE)',
      [userId, recipientId, message_text, message_type]
    );

    // Obtener mensaje completo
    const [newMessage] = await pool.execute(
      `SELECT m.id, m.message_text, m.message_type, m.created_at,
       u.id as user_id, u.username, u.profile_picture
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error enviando mensaje privado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
