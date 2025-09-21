// test-env.js
require('dotenv').config();

console.log('🔍 Verificando variáveis de ambiente:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NÃO DEFINIDA');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'NÃO DEFINIDA');

// Testar conexão manualmente
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((error) => {
  if (error) {
    console.error('❌ Erro de conexão:', error.message);
  } else {
    console.log('✅ Conexão bem-sucedida!');
    connection.end();
  }
});