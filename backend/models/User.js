const { query, execute } = require('../utils/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(row) {
    Object.assign(this, row);
  }

  static fromRow(row) {
    return row ? new User(row) : null;
  }

  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const rows = await query(sql, [email]);
      return User.fromRow(rows[0] || null);
    } catch (error) {
      console.error('Error in User.findByEmail:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM users WHERE id = ?';
      const rows = await query(sql, [id]);
      return User.fromRow(rows[0] || null);
    } catch (error) {
      console.error('Error in User.findById:', error);
      throw error;
    }
  }

  static async create({ name, email, password }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const sql = 'INSERT INTO users (name, email, password, is_active) VALUES (?, ?, ?, ?)';
      const result = await execute(sql, [name, email, hashedPassword, true]);
      return result.insertId;
    } catch (error) {
      console.error('Error in User.create:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      });

      if (fields.length === 0) return;

      values.push(id);

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      await execute(sql, values);
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  }

  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      console.error('Error in comparePassword:', error);
      throw error;
    }
  }

  hasActiveSubscription() {
    if (!this.current_period_end) return false;
    return this.subscription_status === 'active' && new Date(this.current_period_end) > new Date();
  }

  canTrade() {
    return !!(this.is_active && this.hasActiveSubscription() && this.deriv_api_token);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      isActive: !!this.is_active,
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
      balance: typeof this.balance === 'number' ? this.balance : (this.balance ? Number(this.balance) : 0),
      lastLogin: this.last_login,
      canTrade: this.canTrade()
    };
  }
}

module.exports = User;