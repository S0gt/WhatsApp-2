-- Esquema de base de datos para WhatsApp 2
-- Ejecutar este script en MySQL para crear las tablas necesarias

CREATE DATABASE IF NOT EXISTS whatsapp2;
USE whatsapp2;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(255) DEFAULT NULL,
  status_message TEXT DEFAULT NULL,
  theme_preference VARCHAR(20) DEFAULT 'light',
  custom_background VARCHAR(255) DEFAULT NULL,
  privacy_settings JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_online (is_online),
  INDEX idx_last_seen (last_seen)
);

-- Tabla de salas/rooms
CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_public (is_public),
  INDEX idx_created_at (created_at)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  room_id INT DEFAULT NULL,
  recipient_id INT DEFAULT NULL,
  message_text TEXT,
  message_type ENUM('text', 'image', 'video', 'audio', 'document') DEFAULT 'text',
  file_path VARCHAR(255) DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_size INT DEFAULT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_room_time (room_id, created_at),
  INDEX idx_private_chat (user_id, recipient_id, created_at),
  INDEX idx_user_messages (user_id, created_at),
  INDEX idx_message_type (message_type)
);

-- Tabla de participantes de salas
CREATE TABLE IF NOT EXISTS room_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role ENUM('member', 'admin', 'owner') DEFAULT 'member',
  
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participation (room_id, user_id),
  
  INDEX idx_room_participants (room_id),
  INDEX idx_user_rooms (user_id)
);

-- Tabla de chats privados
CREATE TABLE IF NOT EXISTS private_chats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1_id INT NOT NULL,
  user2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user1_chats (user1_id),
  INDEX idx_user2_chats (user2_id),
  UNIQUE KEY unique_chat (user1_id, user2_id)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('message', 'mention', 'file', 'friend_request', 'room_invite') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  related_id INT DEFAULT NULL, -- ID del mensaje, usuario, sala, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_notifications (user_id, is_read, created_at),
  INDEX idx_notification_type (type)
);

-- Tabla de configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSON,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar salas por defecto
INSERT IGNORE INTO rooms (name, description, is_public) VALUES
('General', 'Sala general para todos los usuarios', TRUE),
('Tecnología', 'Habla sobre tecnología y programación', TRUE),
('Música', 'Comparte y habla sobre música', TRUE),
('Deportes', 'Discute sobre deportes y eventos', TRUE),
('Juegos', 'Para gamers y entusiastas de videojuegos', TRUE),
('Cine y TV', 'Películas, series y entretenimiento', TRUE),
('Cocina', 'Recetas, tips culinarios y gastronomía', TRUE),
('Viajes', 'Experiencias de viaje y destinos', TRUE);

-- Configuraciones del sistema por defecto
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('max_file_size', '52428800', 'Tamaño máximo de archivo en bytes (50MB)'),
('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "video/mp4", "audio/mp3", "application/pdf"]', 'Tipos de archivo permitidos'),
('max_message_length', '1000', 'Longitud máxima de mensaje en caracteres'),
('chat_history_limit', '100', 'Límite de mensajes a cargar por defecto'),
('registration_enabled', 'true', 'Si el registro de nuevos usuarios está habilitado');

-- Vistas útiles

-- Vista de mensajes con información de usuario
CREATE OR REPLACE VIEW messages_with_user AS
SELECT 
  m.id,
  m.message_text,
  m.message_type,
  m.file_path,
  m.file_name,
  m.file_size,
  m.room_id,
  m.recipient_id,
  m.is_private,
  m.created_at,
  u.id as user_id,
  u.username,
  u.profile_picture,
  r.name as room_name
FROM messages m
JOIN users u ON m.user_id = u.id
LEFT JOIN rooms r ON m.room_id = r.id;

-- Vista de usuarios en línea
CREATE OR REPLACE VIEW online_users AS
SELECT 
  id,
  username,
  profile_picture,
  status_message,
  last_seen
FROM users 
WHERE is_online = TRUE
ORDER BY last_seen DESC;

-- Vista de estadísticas de salas
CREATE OR REPLACE VIEW room_stats AS
SELECT 
  r.id,
  r.name,
  r.description,
  r.is_public,
  r.created_at,
  COUNT(DISTINCT rp.user_id) as participant_count,
  COUNT(DISTINCT m.id) as message_count,
  MAX(m.created_at) as last_message_time
FROM rooms r
LEFT JOIN room_participants rp ON r.id = rp.room_id
LEFT JOIN messages m ON r.id = m.room_id AND m.is_private = FALSE
GROUP BY r.id, r.name, r.description, r.is_public, r.created_at;
