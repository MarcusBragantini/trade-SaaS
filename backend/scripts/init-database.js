const mysql = require('mysql2');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without selecting a database
    connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Permitir múltiplos comandos SQL
    });

    console.log('✅ Conectado ao servidor MySQL');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'forexai_trading';
    await connection.promise().execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Banco de dados '${dbName}' verificado/criado`);

    // Fechar conexão inicial e conectar ao banco específico
    await connection.promise().end();

    // Conectar ao banco específico
    connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      multipleStatements: true
    });

    console.log(`✅ Conectado ao banco '${dbName}'`);

    // Create tables
    console.log('🔄 Criando tabelas...');
    
    // Users table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        is_active BOOLEAN DEFAULT FALSE,
        deriv_api_token VARCHAR(255) NULL,
        deriv_app_id VARCHAR(255) NULL,
        risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
        daily_loss_limit DECIMAL(10,2) DEFAULT 100.00,
        auto_trading BOOLEAN DEFAULT FALSE,
        ai_analysis BOOLEAN DEFAULT TRUE,
        subscription_plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
        subscription_status ENUM('active', 'canceled', 'expired', 'pending') DEFAULT 'pending',
        current_period_end DATETIME NULL,
        stripe_customer_id VARCHAR(255) NULL,
        stripe_subscription_id VARCHAR(255) NULL,
        balance DECIMAL(12,2) DEFAULT 0.00,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_stripe_customer (stripe_customer_id),
        INDEX idx_subscription_status (subscription_status)
      )
    `);
    console.log('✅ Tabela users criada');

    // Subscriptions table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        \`interval\` VARCHAR(20) NOT NULL,
        status ENUM('active', 'canceled', 'expired', 'pending') DEFAULT 'pending',
        current_period_start DATETIME NOT NULL,
        current_period_end DATETIME NOT NULL,
        stripe_customer_id VARCHAR(255) NOT NULL,
        stripe_subscription_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_stripe_subscription (stripe_subscription_id)
      )
    `);
    console.log('✅ Tabela subscriptions criada');

    // Transactions table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        asset VARCHAR(20) NOT NULL,
        direction ENUM('BUY', 'SELL') NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        result ENUM('win', 'loss', 'pending') DEFAULT 'pending',
        profit_loss DECIMAL(12,2) DEFAULT 0.00,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        details TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp)
      )
    `);
    console.log('✅ Tabela transactions criada');

    // Positions table
    await connection.promise().execute(`
      CREATE TABLE IF NOT EXISTS positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        asset VARCHAR(20) NOT NULL,
        type ENUM('BUY', 'SELL') NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        entry_price DECIMAL(12,6) NOT NULL,
        current_price DECIMAL(12,6) NOT NULL,
        stop_loss DECIMAL(12,6) NULL,
        take_profit DECIMAL(12,6) NULL,
        status ENUM('open', 'closed') DEFAULT 'open',
        profit_loss DECIMAL(12,2) DEFAULT 0.00,
        opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Tabela positions criada');

    // Create default admin user if it doesn't exist
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    try {
      const [existingAdmin] = await connection.promise().execute(
        'SELECT id FROM users WHERE email = ?',
        ['admin@forexai.com']
      );

      if (existingAdmin.length === 0) {
        await connection.promise().execute(
          'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
          ['Administrador', 'admin@forexai.com', hashedPassword, 'admin', true]
        );
        console.log('✅ Usuário administrador padrão criado');
      } else {
        console.log('ℹ️  Usuário administrador já existe');
      }
    } catch (error) {
      console.log('ℹ️  Usuário administrador já existe ou erro:', error.message);
    }

    // Create test user for login
    try {
      const [existingUser] = await connection.promise().execute(
        'SELECT id FROM users WHERE email = ?',
        ['bragantini34@gmail.com']
      );

      if (existingUser.length === 0) {
        const userPassword = await bcrypt.hash('Mvb081521', 12);
        await connection.promise().execute(
          'INSERT INTO users (name, email, password, is_active) VALUES (?, ?, ?, ?)',
          ['Usuario Teste', 'bragantini34@gmail.com', userPassword, true]
        );
        console.log('✅ Usuário de teste criado (bragantini34@gmail.com / Mvb081521)');
      } else {
        console.log('ℹ️  Usuário de teste já existe');
      }
    } catch (error) {
      console.log('ℹ️  Usuário de teste já existe ou erro:', error.message);
    }

    console.log('\n🎉 Banco de dados inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco de dados:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.promise().end();
      console.log('✅ Conexão com MySQL fechada');
    }
  }
}

// Run the initialization
initializeDatabase();