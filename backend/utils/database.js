const mysql = require('mysql2');

// Conexão global
let db;

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando conexão com MySQL...');
    
    // Configuração FIXA - use estas credenciais diretamente
    const config = {
      host: 'localhost',
      user: 'root', 
      password: 'Bragantini', // Senha que funcionou no teste manual
      database: 'forexai_trading',
      charset: 'utf8mb4',
      timezone: '+00:00'
    };
    
    console.log('📋 Usando configuração:');
    console.log('   Host:', config.host);
    console.log('   User:', config.user);
    console.log('   Database:', config.database);
    console.log('   Password: ***'); // Não mostrar a senha no log
    
    db = mysql.createConnection(config);

    // Testar a conexão
    await new Promise((resolve, reject) => {
      db.connect((error) => {
        if (error) {
          console.error('❌ Erro na conexão MySQL:', error.message);
          reject(error);
        } else {
          console.log('✅ Conectado ao MySQL com sucesso');
          resolve();
        }
      });
    });
    
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar MySQL:', error.message);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

async function query(sql, params = []) {
  try {
    return await new Promise((resolve, reject) => {
      if (params && params.length > 0) {
        // Usar execute para queries com parâmetros
        getDB().execute(sql, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      } else {
        // Usar query para comandos simples
        getDB().query(sql, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      }
    });
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function execute(sql, params = []) {
  try {
    return await new Promise((resolve, reject) => {
      if (params && params.length > 0) {
        getDB().execute(sql, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      } else {
        getDB().query(sql, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      }
    });
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getDB,
  query,
  execute
};