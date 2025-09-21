// test-connection.js
const { initializeDatabase, query } = require('./utils/database');

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o banco...');
    await initializeDatabase();
    console.log('✅ Conexão estabelecida');
    
    const result = await query('SELECT 1 as test');
    console.log('✅ Query test successful:', result);
    
    const users = await query('SELECT * FROM users');
    console.log('✅ Users found:', users.length);
    console.log('Users:', users);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();