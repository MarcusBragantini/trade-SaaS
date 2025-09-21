// test-connection-fixed.js
const { initializeDatabase, query } = require('./utils/database');

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o banco...');
    await initializeDatabase();
    console.log('✅ Conexão estabelecida');
    
    // Testar com query simples
    const result = await query('SELECT 1 as test');
    console.log('✅ Query test successful:', result);
    
    // Verificar usuários
    const users = await query('SELECT * FROM users');
    console.log('✅ Users found:', users.length);
    
    if (users.length > 0) {
      console.log('📋 Primeiro usuário:', {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();