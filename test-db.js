// test-db.js - Script para probar conexión a base de datos
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🧪 Iniciando prueba de conexión a MySQL...\n');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    acquireTimeout: 60000,
    timeout: 60000,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  };

  console.log('📋 Configuración de conexión:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Usuario: ${config.user}`);
  console.log(`   Base de datos: ${config.database}`);
  console.log(`   Puerto: ${config.port}`);
  console.log(`   SSL: ${config.ssl ? 'Habilitado' : 'Deshabilitado'}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    console.log('🔄 Creando conexión...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Conexión establecida');
    
    console.log('🔍 Probando consulta SELECT...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    console.log('📊 Resultado:', rows[0]);
    
    console.log('🗂️ Verificando tablas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    
    if (tables.length > 0) {
      console.log('📝 Lista de tablas:');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }

    await connection.end();
    console.log('\n🎉 ¡Prueba de conexión exitosa!');
    
  } catch (error) {
    console.error('\n❌ Error en la conexión:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code}`);
    if (error.errno) console.error(`   Errno: ${error.errno}`);
    if (error.sqlState) console.error(`   SQL State: ${error.sqlState}`);
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que las credenciales sean correctas');
    console.log('   2. Asegurar que el servidor MySQL esté ejecutándose');
    console.log('   3. Verificar que el puerto esté abierto');
    console.log('   4. Para Render: configurar SSL y firewall');
    
    process.exit(1);
  }
}

testConnection();
