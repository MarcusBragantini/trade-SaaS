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
    const hasToken = this.deriv_account_type === 'demo' 
      ? this.deriv_demo_token 
      : this.deriv_real_token;
    return !!(this.is_active && this.hasActiveSubscription() && hasToken);
  }

  getDerivToken() {
    return this.deriv_account_type === 'demo' 
      ? this.deriv_demo_token 
      : this.deriv_real_token;
  }

  getDerivAppId() {
    return this.deriv_account_type === 'demo' 
      ? this.deriv_demo_app_id 
      : this.deriv_real_app_id;
  }

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
      canTrade: this.canTrade(),
      deriv: {
        accountType: this.deriv_account_type,
        demoToken: this.deriv_demo_token,
        demoAppId: this.deriv_demo_app_id,
        realToken: this.deriv_real_token,
        realAppId: this.deriv_real_app_id,
        activeToken: this.getDerivToken(),
        activeAppId: this.getDerivAppId()
      },
      // Manter compatibilidade com código antigo
      deriv_api_token: this.getDerivToken(),
      deriv_app_id: this.getDerivAppId()
    };
  }

  // Método estático para atualizar usuário por ID
  static async updateById(userId, updates) {
    const db = require('../utils/database');
    
    try {
      const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(userId);
      
      const result = await db.execute(
        `UPDATE users SET ${updateFields} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Métodos para configurações de trading
  static async updateTradingSettings(userId, settings) {
    try {
      const updateFields = [];
      const values = [];

      // Mapear configurações para campos do banco
      const fieldMapping = {
        stopWin: 'stop_win',
        stopLoss: 'stop_loss',
        martingaleEnabled: 'martingale_enabled',
        martingaleMultiplier: 'martingale_multiplier',
        maxMartingaleLevels: 'max_martingale_levels',
        tradeAmount: 'trade_amount',
        maxDailyTrades: 'max_daily_trades',
        riskPerTrade: 'risk_per_trade',
        aiConfidenceThreshold: 'ai_confidence_threshold',
        aiAnalysisInterval: 'ai_analysis_interval',
        tradingPairs: 'trading_pairs',
        tradingHoursStart: 'trading_hours_start',
        tradingHoursEnd: 'trading_hours_end',
        autoTradingEnabled: 'auto_trading_enabled',
        ticketQuantity: 'ticket_quantity',
        tradeCooldown: 'trade_cooldown'
      };

      for (const [key, value] of Object.entries(settings)) {
        const dbField = fieldMapping[key];
        if (dbField) {
          updateFields.push(`${dbField} = ?`);
          values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('Nenhuma configuração válida fornecida');
      }

      values.push(userId);

      const result = await execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar configurações de trading:', error);
      throw error;
    }
  }

  static async getTradingSettings(userId) {
    try {
      const sql = `
        SELECT 
          stop_win, stop_loss, martingale_enabled, martingale_multiplier,
          max_martingale_levels, trade_amount, max_daily_trades, risk_per_trade,
          ai_confidence_threshold, ai_analysis_interval, trading_pairs,
          trading_hours_start, trading_hours_end, auto_trading_enabled,
          ticket_quantity, trade_cooldown
        FROM users WHERE id = ?
      `;
      const rows = await query(sql, [userId]);
      
      if (rows.length === 0) {
        return this.getDefaultTradingSettings();
      }

      const settings = rows[0];
      
      // Converter JSON strings de volta para objetos
      if (settings.trading_pairs && typeof settings.trading_pairs === 'string') {
        try {
          settings.trading_pairs = JSON.parse(settings.trading_pairs);
        } catch (e) {
          settings.trading_pairs = ['R_10', 'R_25', 'R_50'];
        }
      }

      return {
        stopWin: settings.stop_win || 50,
        stopLoss: settings.stop_loss || 100,
        martingaleEnabled: settings.martingale_enabled || false,
        martingaleMultiplier: settings.martingale_multiplier || 2.0,
        maxMartingaleLevels: settings.max_martingale_levels || 3,
        tradeAmount: settings.trade_amount || 5,
        maxDailyTrades: settings.max_daily_trades || 50,
        riskPerTrade: settings.risk_per_trade || 1.0,
        aiConfidenceThreshold: settings.ai_confidence_threshold || 60,
        aiAnalysisInterval: settings.ai_analysis_interval || 10,
        tradingPairs: settings.trading_pairs || ['R_10', 'R_25', 'R_50'],
        tradingHoursStart: settings.trading_hours_start || '00:00',
        tradingHoursEnd: settings.trading_hours_end || '23:59',
        autoTradingEnabled: settings.auto_trading_enabled || false,
        ticketQuantity: settings.ticket_quantity || 10,
        tradeCooldown: settings.trade_cooldown || 5
      };
    } catch (error) {
      console.error('Erro ao obter configurações de trading:', error);
      return this.getDefaultTradingSettings();
    }
  }

  static getDefaultTradingSettings() {
    return {
      stopWin: 50,
      stopLoss: 100,
      martingaleEnabled: false,
      martingaleMultiplier: 2.0,
      maxMartingaleLevels: 3,
      tradeAmount: 5,
      maxDailyTrades: 50,
      riskPerTrade: 1.0,
      aiConfidenceThreshold: 60,
      aiAnalysisInterval: 10,
      tradingPairs: ['R_10', 'R_25', 'R_50'],
        tradingHoursStart: '00:00',
        tradingHoursEnd: '23:59',
        autoTradingEnabled: false,
        ticketQuantity: 10,
        tradeCooldown: 5
    };
  }

  static async resetTradingSettings(userId) {
    try {
      const defaultSettings = this.getDefaultTradingSettings();
      return await this.updateTradingSettings(userId, defaultSettings);
    } catch (error) {
      console.error('Erro ao resetar configurações de trading:', error);
      throw error;
    }
  }
}

module.exports = User;