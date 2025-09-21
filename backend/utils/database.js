const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config();

let db;
let isMemory = false;

// Memória simples para desenvolvimento sem MySQL
const memory = {
  users: [],
  subscriptions: [],
  positions: [],
  transactions: []
};

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando conexão com MySQL...');

    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'forexai_trading',
      charset: 'utf8mb4',
      timezone: '+00:00',
      decimalNumbers: true
    };

    db = mysql.createConnection(config);

    await new Promise((resolve, reject) => {
      db.connect((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    console.log('✅ Conectado ao MySQL com sucesso');
    return db;
  } catch (error) {
    console.warn('⚠️  MySQL indisponível. Ativando modo memória (DEV). Detalhe:', error.message);
    isMemory = true;
    seedMemory();
    return null;
  }
}

function seedMemory() {
  if (memory.users.length === 0) {
    const bcrypt = require('bcryptjs');
    const now = new Date();
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('Mvb081521', 10);
    memory.users.push(
      {
        id: 1,
        name: 'Administrador',
        email: 'admin@forexai.com',
        password: adminPassword,
        role: 'admin',
        is_active: true,
        subscription_plan: 'free',
        subscription_status: 'pending',
        balance: 0,
        last_login: now
      },
      {
        id: 2,
        name: 'Usuario Teste',
        email: 'bragantini34@gmail.com',
        password: userPassword,
        role: 'user',
        is_active: true,
        subscription_plan: 'free',
        subscription_status: 'pending',
        balance: 1000,
        last_login: now
      }
    );
  }
}

function getDB() {
  if (isMemory) return null;
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

async function query(sql, params = []) {
  if (isMemory) {
    // Implementações mínimas necessárias
    if (/SELECT \* FROM users WHERE email = \?/i.test(sql)) {
      const email = params[0];
      return memory.users.filter(u => u.email === email);
    }
    if (/SELECT \* FROM users WHERE id = \?/i.test(sql)) {
      const id = params[0];
      return memory.users.filter(u => u.id == id);
    }
    if (/SELECT 1 as test/i.test(sql)) {
      return [{ test: 1 }];
    }
    if (/SELECT COUNT\(\*\) as count FROM users/i.test(sql)) {
      return [{ count: memory.users.length }];
    }
    // Fallback
    return [];
  }

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
}

async function execute(sql, params = []) {
  if (isMemory) {
    // INSERT user
    if (/INSERT INTO users \(name, email, password, is_active\) VALUES \(\?, \?, \?, \?\)/i.test(sql)) {
      const [name, email, password, is_active] = params;
      const id = memory.users.length ? Math.max(...memory.users.map(u => u.id)) + 1 : 1;
      memory.users.push({ id, name, email, password, is_active: !!is_active, role: 'user' });
      return { insertId: id };
    }
    // UPDATE users SET ... WHERE id = ?
    if (/UPDATE users SET/i.test(sql) && /WHERE id = \?/i.test(sql)) {
      const id = params[params.length - 1];
      const setPart = sql.replace(/^[\s\S]*SET /i, '').replace(/ WHERE[\s\S]*$/i, '');
      const keys = setPart.split(',').map(k => k.trim().split(' = ')[0].replace(/`/g, ''));
      const values = params.slice(0, -1);
      const user = memory.users.find(u => u.id == id);
      if (user) {
        keys.forEach((key, idx) => {
          user[key] = values[idx];
        });
      }
      return { affectedRows: user ? 1 : 0 };
    }
    // INSERT subscriptions ...
    if (/INSERT INTO subscriptions/i.test(sql)) {
      const id = memory.subscriptions.length ? Math.max(...memory.subscriptions.map(s => s.id || 0)) + 1 : 1;
      memory.subscriptions.push({ id });
      return { insertId: id };
    }
    return { insertId: 0, affectedRows: 0 };
  }

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
}

module.exports = {
  initializeDatabase,
  getDB,
  query,
  execute
};