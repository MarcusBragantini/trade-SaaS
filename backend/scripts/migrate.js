const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config();
const mysql = require('mysql2/promise');

async function addColumnIfMissing(conn, table, sql) {
  try { await conn.execute(sql); console.log('OK ->', sql); }
  catch (e) {
    if (/Duplicate column name|exists/.test(e.message)) {
      console.log('SKIP ->', sql);
    } else { throw e; }
  }
}

(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'forexai_trading',
    multipleStatements: true,
  };
  const conn = await mysql.createConnection(config);
  try {
    // Users: adicionar colunas usadas pelo app
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1");
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN balance DECIMAL(12,2) DEFAULT 0.00");
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN subscription_plan ENUM('free','basic','pro','enterprise') DEFAULT 'free'");
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN subscription_status ENUM('active','canceled','expired','pending') DEFAULT 'pending'");
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN current_period_end DATETIME NULL");
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN deriv_api_token VARCHAR(255) NULL");
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN deriv_app_id VARCHAR(255) NULL");
    // role (se não existir)
    await addColumnIfMissing(conn, 'users', "ALTER TABLE users ADD COLUMN role ENUM('user','admin') DEFAULT 'user'");

    console.log('\nMigração concluída.');
    process.exit(0);
  } catch (e) {
    console.error('Erro na migração:', e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();