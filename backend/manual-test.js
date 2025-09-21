// manual-test.js
const mysql = require('mysql2');

console.log('🔍 Testando conexão manual...');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Bragantini', // ← Senha diretamente aqui
  database: 'forexai_trading'
});

connection.connect((error) => {
  if (error) {
    console.error('❌ Erro de conexão manual:', error.message);
  } else {
    console.log('✅ Conexão manual bem-sucedida!');
    
    // Testar uma query
    connection.query('SELECT * FROM users', (error, results) => {
      if (error) {
        console.error('❌ Erro na query:', error.message);
      } else {
        console.log(`✅ ${results.length} usuários encontrados`);
        results.forEach(user => {
          console.log(` - ${user.name} (${user.email})`);
        });
      }
      connection.end();
    });
  }
});