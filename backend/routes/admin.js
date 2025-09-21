const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const { query, execute } = require('../utils/database');
    
    const users = await query(`
      SELECT id, name, email, role, is_active, subscription_plan, 
             subscription_status, balance, last_login, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar usuários'
    });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      status: 'success',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar usuário'
    });
  }
});

// Update user (admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, subscription_plan, subscription_status, balance } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.is_active = isActive;
    if (subscription_plan !== undefined) updates.subscription_plan = subscription_plan;
    if (subscription_status !== undefined) updates.subscription_status = subscription_status;
    if (balance !== undefined) updates.balance = balance;

    await User.update(id, updates);

    const updatedUser = await User.findById(id);

    res.json({
      status: 'success',
      message: 'Usuário atualizado com sucesso',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar usuário'
    });
  }
});

// Get system statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const { query } = require('../utils/database');
    
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');
    const activeSubscriptions = await query('SELECT COUNT(*) as count FROM users WHERE subscription_status = "active"');
    const totalRevenue = await query('SELECT SUM(amount) as total FROM subscriptions WHERE status = "active"');
    const recentTrades = await query('SELECT COUNT(*) as count FROM transactions WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)');

    const stats = {
      totalUsers: totalUsers[0].count,
      activeSubscriptions: activeSubscriptions[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      recentTrades: recentTrades[0].count
    };

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar estatísticas'
    });
  }
});

module.exports = router;