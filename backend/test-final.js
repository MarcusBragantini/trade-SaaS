// test-final.js
const { initializeDatabase, query } = require('./utils/database');

async function test() {
  try {
    console.log('🧪 Teste final de conexão...');
    await initializeDatabase();
    
    const users = await query('SELECT * FROM users');
    console.log(`✅ ${users.length} usuários encontrados:`);
    
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });
    
  } catch (error) {
    console.error('❌ Erro final:', error.message);
  }
}

test();