const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Configuración de multer para diferentes tipos de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = '';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(__dirname, '../../uploads/images');
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(__dirname, '../../uploads/videos');
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(__dirname, '../../uploads/audio');
    } else {
      uploadPath = path.join(__dirname, '../../uploads/documents');
    }

    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// Filtros de archivos
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = [
    // Imágenes
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
    // Audio
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg',
    // Documentos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // Archivos comprimidos
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo
  }
});

// Subir archivo general
router.post('/file', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha enviado ningún archivo' });
    }

    // Determinar la categoría del archivo
    let category = 'document';
    if (req.file.mimetype.startsWith('image/')) category = 'image';
    else if (req.file.mimetype.startsWith('video/')) category = 'video';
    else if (req.file.mimetype.startsWith('audio/')) category = 'audio';

    // Construir la URL del archivo
    const fileUrl = `/uploads/${category}s/${req.file.filename}`;

    res.json({
      message: 'Archivo subido exitosamente',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        category: category
      }
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Subir imagen de perfil
router.post('/profile-picture', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha enviado ninguna imagen' });
    }

    // Verificar que sea una imagen
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen' });
    }

    const { pool } = require('../db');
    const imageUrl = `/uploads/images/${req.file.filename}`;

    // Actualizar la foto de perfil en la base de datos
    await pool.execute(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [imageUrl, req.user.userId]
    );

    res.json({
      message: 'Foto de perfil actualizada exitosamente',
      profilePicture: imageUrl
    });
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Subir múltiples archivos
router.post('/multiple', verifyToken, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se han enviado archivos' });
    }

    const uploadedFiles = req.files.map(file => {
      let category = 'document';
      if (file.mimetype.startsWith('image/')) category = 'image';
      else if (file.mimetype.startsWith('video/')) category = 'video';
      else if (file.mimetype.startsWith('audio/')) category = 'audio';

      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${category}s/${file.filename}`,
        category: category
      };
    });

    res.json({
      message: 'Archivos subidos exitosamente',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error subiendo archivos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener información de un archivo
router.get('/info/:filename', verifyToken, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Buscar el archivo en todos los directorios
    const directories = ['images', 'videos', 'audio', 'documents'];
    let fileInfo = null;

    for (const dir of directories) {
      const filePath = path.join(__dirname, `../../uploads/${dir}`, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileInfo = {
          filename: filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/${dir}/${filename}`,
          category: dir.slice(0, -1) // Remover la 's' del final
        };
        break;
      }
    }

    if (!fileInfo) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    res.json(fileInfo);
  } catch (error) {
    console.error('Error obteniendo información del archivo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar archivo
router.delete('/:filename', verifyToken, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Buscar y eliminar el archivo en todos los directorios
    const directories = ['images', 'videos', 'audio', 'documents'];
    let fileDeleted = false;

    for (const dir of directories) {
      const filePath = path.join(__dirname, `../../uploads/${dir}`, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
        break;
      }
    }

    if (!fileDeleted) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande (máximo 50MB)' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Demasiados archivos (máximo 10)' });
    }
  }
  
  if (error.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ message: 'Tipo de archivo no permitido' });
  }

  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = router;
