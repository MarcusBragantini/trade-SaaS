const express = require('express');
const { validateTradeExecution } = require('../middleware/validation');
const router = express.Router();

// Rota pública de teste
router.get('/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Trading API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Get trading dashboard (PROTEGIDA)
// Backend - routes/trading.js (Atualize a rota dashboard)
router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const dashboardData = {
      balance: user.balance || 0,
      dailyProfit: 150.50,
      openPositions: 2,
      winRate: 65
    };

    res.json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar dashboard'
    });
  }
});

// Execute trade
router.post('/execute', validateTradeExecution, async (req, res) => {
  try {
    const { pair, type, amount, stopLoss, takeProfit } = req.body;

    // Simulação de execução de trade
    const tradeResult = {
      id: Date.now(),
      pair,
      type,
      amount,
      status: 'executed',
      timestamp: new Date(),
      profit: Math.random() > 0.5 ? amount * 0.02 : -amount * 0.01
    };

    res.json({
      status: 'success',
      message: 'Trade executado com sucesso',
      data: tradeResult
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao executar trade'
    });
  }
});

// Get open positions
router.get('/positions', async (req, res) => {
  try {
    // Simulação de posições abertas
    const positions = [
      {
        id: 1,
        pair: 'EUR/USD',
        type: 'BUY',
        amount: 100,
        entryPrice: 1.0850,
        currentPrice: 1.0875,
        profit: 25.00,
        openedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
      },
      {
        id: 2,
        pair: 'GBP/USD',
        type: 'SELL',
        amount: 50,
        entryPrice: 1.2650,
        currentPrice: 1.2625,
        profit: 12.50,
        openedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
      }
    ];

    res.json({
      status: 'success',
      data: positions
    });
  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar posições'
    });
  }
});

// Close position
router.post('/positions/:id/close', async (req, res) => {
  try {
    const { id } = req.params;

    // Simulação de fechamento de posição
    const closedPosition = {
      id: parseInt(id),
      closedAt: new Date(),
      profit: Math.random() > 0.5 ? 50.00 : -20.00
    };

    res.json({
      status: 'success',
      message: 'Posição fechada com sucesso',
      data: closedPosition
    });
  } catch (error) {
    console.error('Close position error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao fechar posição'
    });
  }
});

// Get trading history
router.get('/history', async (req, res) => {
  try {
    // Simulação de histórico de trades
    const history = [
      {
        id: 1,
        pair: 'EUR/USD',
        direction: 'BUY',
        amount: 100,
        result: 'win',
        profitLoss: 25.00,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 dia atrás
      },
      {
        id: 2,
        pair: 'USD/JPY',
        direction: 'SELL',
        amount: 50,
        result: 'loss',
        profitLoss: -15.00,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 horas atrás
      }
    ];

    res.json({
      status: 'success',
      data: history
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar histórico'
    });
  }
});

module.exports = router;