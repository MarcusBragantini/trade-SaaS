const { query, execute } = require('../utils/database');

class Subscription {
  // Create a new subscription
  static async create(subscriptionData) {
    const {
      userId,
      planId,
      interval,
      status = 'active',
      currentPeriodStart,
      currentPeriodEnd,
      stripeCustomerId,
      stripeSubscriptionId,
      amount
    } = subscriptionData;

    const sql = `
      INSERT INTO subscriptions (user_id, plan_id, \`interval\`, status, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await execute(sql, [
      userId,
      planId,
      interval,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      stripeCustomerId,
      stripeSubscriptionId,
      amount
    ]);

    return result.insertId;
  }

  // Find subscription by ID
  static async findById(id) {
    const sql = 'SELECT * FROM subscriptions WHERE id = ?';
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }

  // Find subscription by Stripe subscription ID
  static async findByStripeSubscriptionId(stripeSubscriptionId) {
    const sql = 'SELECT * FROM subscriptions WHERE stripe_subscription_id = ?';
    const rows = await query(sql, [stripeSubscriptionId]);
    return rows[0] || null;
  }

  // Find subscriptions by user ID
  static async findByUserId(userId) {
    const sql = 'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC';
    const rows = await query(sql, [userId]);
    return rows;
  }

  // Update subscription
  static async update(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      // Usar crases para a coluna interval
      const fieldName = key === 'interval' ? '`interval`' : key;
      fields.push(`${fieldName} = ?`);
      values.push(updates[key]);
    });

    values.push(id);

    const sql = `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`;
    await execute(sql, values);
  }

  // Update user subscription info
  static async updateUserSubscription(userId, subscriptionData) {
    const updates = {
      subscription_plan: subscriptionData.plan,
      subscription_status: subscriptionData.status,
      current_period_end: subscriptionData.currentPeriodEnd,
      stripe_customer_id: subscriptionData.stripeCustomerId,
      stripe_subscription_id: subscriptionData.stripeSubscriptionId,
      is_active: subscriptionData.status === 'active'
    };

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await execute(sql, values);
  }
}

module.exports = Subscription;