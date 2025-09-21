// scripts/dev-setup.js
const { query, execute, initializeDatabase } = require('../utils/database');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await initializeDatabase();

    // 1) Garantir saldo inicial
    const email = 'bragantini34@gmail.com';
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      const user = users[0];
      const newBalance = 10000.00;
      await execute('UPDATE users SET balance = ?, is_active = ? WHERE id = ?', [newBalance, 1, user.id]);
      console.log('✅ Saldo atualizado para', newBalance);
    }

    // 2) Criar assinatura ativa simples
    const [userRow] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (userRow) {
      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      await execute(
        'UPDATE users SET subscription_plan = ?, subscription_status = ?, current_period_end = ?, is_active = ? WHERE id = ?',
        ['pro', 'active', periodEnd, 1, userRow.id]
      );
      console.log('✅ Assinatura marcada como ativa (pro)');
    }

    // 3) Configurar token Deriv simulado (para liberar UI)
    if (userRow) {
      await execute('UPDATE users SET deriv_api_token = ?, deriv_app_id = ? WHERE id = ?', [
        'SIMULATED_TOKEN_ONLY_FOR_DEV', '12345', userRow.id
      ]);
      console.log('✅ Credenciais Deriv simuladas configuradas');
    }

    console.log('\n🎉 Ambiente DEV preparado com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no dev-setup:', err);
    process.exit(1);
  }
})();

