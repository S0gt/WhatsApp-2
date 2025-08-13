const express = require('express');
const router = express.Router();

// Ruta para debug de variables de entorno (solo en desarrollo)
router.get('/env', (req, res) => {
  // Solo mostrar información en producción para debugging
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'no definido',
    PORT: process.env.PORT || 'no definido',
    DATABASE_INFO: {
      DB_HOST: process.env.DB_HOST || 'no definido',
      DB_USER: process.env.DB_USER || 'no definido',
      DB_PASSWORD: process.env.DB_PASSWORD ? '[DEFINIDA]' : 'no definida',
      DB_NAME: process.env.DB_NAME || 'no definido',
      DB_PORT: process.env.DB_PORT || 'no definido'
    },
    RENDER_INFO: {
      RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME || 'no definido',
      RENDER_SERVICE_TYPE: process.env.RENDER_SERVICE_TYPE || 'no definido',
      RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || 'no definido'
    },
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
      key.startsWith('DB_') || 
      key.startsWith('RENDER_') || 
      key === 'NODE_ENV' || 
      key === 'PORT'
    ).sort()
  };

  res.json({
    success: true,
    message: 'Información de variables de entorno',
    data: envInfo,
    timestamp: new Date().toISOString()
  });
});

// Ruta para test de base de datos
router.get('/db-test', async (req, res) => {
  try {
    const { promisePool } = require('../db');
    
    console.log('🔍 Testing database connection via API...');
    const [rows] = await promisePool.execute('SELECT 1 as test, NOW() as current_time');
    
    res.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        test_result: rows[0],
        connection_info: {
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          database: process.env.DB_NAME || 'whatsapp2',
          port: process.env.DB_PORT || 3306
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error de conexión a base de datos',
      details: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      },
      connection_attempt: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        database: process.env.DB_NAME || 'whatsapp2',
        port: process.env.DB_PORT || 3306
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta de estado general
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp 2 - Debug API funcionando',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /api/debug/env - Variables de entorno',
      'GET /api/debug/db-test - Test de base de datos',
      'GET /api/debug/status - Estado del servicio'
    ]
  });
});

module.exports = router;
