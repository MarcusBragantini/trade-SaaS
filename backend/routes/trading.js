const express = require('express');
const { validateTradeExecution } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');
const { subscriptionMiddleware, tradingMiddleware } = require('../middleware/subscription');
const { tradingLimiter } = require('../middleware/rateLimiting');
const User = require('../models/User');
const router = express.Router();

// Rota pública de teste
router.get('/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Trading API está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Get trading dashboard (protegida por auth, sem exigir assinatura ativa)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const toNumber = (v) => typeof v === 'number' ? v : (v ? Number(v) : 0);

    let balance = toNumber(user && user.balance);
    let dailyProfit = 0;
    let openPositions = 0;
    let winRate = 0;

    // Se o usuário tem credenciais da Deriv, tentar buscar dados reais
    if (user && user.deriv_api_token) {
      try {
        console.log('🔍 Tentando buscar dados reais da Deriv...');
        // Fazer requisição para a rota de balance da Deriv
        const balanceResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/deriv/balance`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          if (balanceData.status === 'success') {
            balance = balanceData.data.balance;
            dailyProfit = balanceData.data.profit || 0;
            console.log('✅ Dados reais da Deriv obtidos:', balance);
          }
        }
      } catch (derivError) {
        console.log('⚠️ Erro ao buscar dados da Deriv, usando dados locais:', derivError.message);
      }
    } else {
      console.log('📊 Usando dados locais - token Deriv não configurado');
    }
    
    // Simular alguns dados de trading
    dailyProfit = dailyProfit || (Math.random() * 100 - 50); // Lucro/perda aleatório entre -50 e +50
    openPositions = Math.floor(Math.random() * 5); // 0-4 posições abertas
    winRate = Math.floor(Math.random() * 40) + 60; // Taxa de acerto entre 60-100%

    const dashboardData = {
      balance,
      dailyProfit,
      openPositions,
      winRate
    };

    res.json({ status: 'success', data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao carregar dashboard' });
  }
});
// Execute trade (protegida por auth e trading)
router.post('/execute', tradingLimiter, authMiddleware, tradingMiddleware, validateTradeExecution, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { pair, type, amount, stopLoss, takeProfit } = req.body;

                // Se o usuário tem token da Deriv, executar trade real
                if (user && user.deriv_api_token) {
                  try {
                    console.log('🚀 Executando trade real na Deriv...');
                    
                    // Fazer requisição para a rota de execução da Deriv
                    const tradeResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/deriv/execute-trade`, {
                      method: 'POST',
                      headers: {
                        'Authorization': req.headers.authorization,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ pair, type, amount, stopLoss, takeProfit })
                    });
                    
                    if (tradeResponse.ok) {
                      const tradeData = await tradeResponse.json();
                      console.log('✅ Trade executado na Deriv:', tradeData);
                      return res.json(tradeData);
                    } else {
                      console.log('⚠️ Erro na Deriv, usando simulação local');
                    }
                  } catch (derivError) {
                    console.log('⚠️ Erro ao executar na Deriv, usando simulação local:', derivError.message);
                  }
                } else {
                  console.log('📊 Executando trade simulado - token Deriv não configurado');
                }

                // MODO DESENVOLVIMENTO: Sempre simular trades para teste
                console.log('🧪 MODO DESENVOLVIMENTO: Simulando trade para teste');

    // Simulação de execução de trade (fallback)
    const isWin = Math.random() > 0.4; // 60% chance de ganhar
    const profitMultiplier = isWin ? 0.8 : -1.0; // Ganha 80% ou perde 100%
    const profit = amount * profitMultiplier;
    
    const tradeResult = {
      id: Date.now(),
      pair,
      type,
      amount,
      status: 'executed',
      timestamp: new Date(),
      profit: profit,
      realTrade: false,
      simulation: true,
      message: isWin ? 'Trade simulado: GANHOU!' : 'Trade simulado: PERDEU!',
      contractId: `SIM_${Date.now()}`,
      entryPrice: Math.random() * 1000 + 50000, // Preço simulado
      exitPrice: Math.random() * 1000 + 50000,  // Preço simulado
      duration: '5m'
    };

    res.json({
      status: 'success',
      message: 'Trade executado com sucesso (simulado)',
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

// Get open positions (protegida por auth e trading, sem rate limiting para uso frequente)
router.get('/positions', authMiddleware, tradingMiddleware, async (req, res) => {
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

// Close position (protegida por auth e trading)
router.post('/positions/:id/close', authMiddleware, tradingMiddleware, async (req, res) => {
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

// Get trading history (protegida por auth)
router.get('/history', authMiddleware, async (req, res) => {
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