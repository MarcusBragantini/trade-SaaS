// test-mysql-connection.js
const mysql = require('mysql2');

const testConfigurations = [
  { host: 'localhost', user: 'root', password: '' },
  { host: 'localhost', user: 'root', password: 'root' },
  { host: 'localhost', user: 'root', password: 'Bragantini' },
  { host: '127.0.0.1', user: 'root', password: '' },
  { host: '127.0.0.1', user: 'root', password: 'root' },
];

async function testConnections() {
  for (const config of testConfigurations) {
    try {
      console.log(`\n🔍 Testando: ${config.user}@${config.host} (password: ${config.password || 'vazia'})`);
      
      const connection = mysql.createConnection(config);
      
      await connection.promise().execute('SELECT 1');
      console.log('✅ Conexão bem-sucedida!');
      
      // Verificar se o banco existe
      const [databases] = await connection.promise().execute('SHOW DATABASES');
      const dbExists = databases.some(db => db.Database === 'forexai_trading');
      console.log(`📊 Banco 'forexai_trading' existe: ${dbExists}`);
      
      if (dbExists) {
        await connection.promise().execute('USE forexai_trading');
        const [tables] = await connection.promise().execute('SHOW TABLES');
        console.log(`📋 Tabelas encontradas: ${tables.length}`);
      }
      
      connection.end();
      return config; // Retorna a configuração que funcionou
      
    } catch (error) {
      console.log(`❌ Falha: ${error.message}`);
    }
  }
  
  console.log('\n❌ Nenhuma configuração funcionou. Verifique seu MySQL.');
  return null;
}

testConnections().then(workingConfig => {
  if (workingConfig) {
    console.log('\n🎉 Configuração que funcionou:');
    console.log(workingConfig);
  }
});