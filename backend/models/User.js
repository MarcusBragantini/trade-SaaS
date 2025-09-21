const { query, execute } = require('../utils/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by email - com logging
  static async findByEmail(email) {
    try {
      console.log('Buscando usuário por email:', email);
      const sql = 'SELECT * FROM users WHERE email = ?';
      const rows = await query(sql, [email]);
      console.log('Resultado da busca:', rows.length > 0 ? 'Encontrado' : 'Não encontrado');
      return rows[0] || null;
    } catch (error) {
      console.error('Erro em findByEmail:', error.message);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const rows = await query(sql, [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in User.findByEmail:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM users WHERE id = ?';
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in User.findById:', error);
      throw error;
    }
  }

  // Update user
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      });

      values.push(id);

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      await execute(sql, values);
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error('Error in comparePassword:', error);
      throw error;
    }
  }

  // Check if subscription is active
  hasActiveSubscription() {
    if (!this.current_period_end) return false;
    return this.subscription_status === 'active' && new Date(this.current_period_end) > new Date();
  }

  // Check if user can trade
  canTrade() {
    return this.is_active && this.hasActiveSubscription() && this.deriv_api_token;
  }

  // Format user for response
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      isActive: this.is_active,
      subscription: {
        plan: this.subscription_plan,
        status: this.subscription_status,
        currentPeriodEnd: this.current_period_end,
        stripeCustomerId: this.stripe_customer_id,
        stripeSubscriptionId: this.stripe_subscription_id
      },
      tradingSettings: {
        riskLevel: this.risk_level,
        dailyLossLimit: this.daily_loss_limit,
        autoTrading: this.auto_trading,
        aiAnalysis: this.ai_analysis
      },
      balance: this.balance,
      lastLogin: this.last_login,
      canTrade: this.canTrade()
    };
  }
}

module.exports = User;