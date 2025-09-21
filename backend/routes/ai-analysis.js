const express = require('express');
const { tradingMiddleware } = require('../middleware/subscription');
const { aiAnalysisLimiter } = require('../middleware/rateLimiting');
const router = express.Router();

// Configuração de moedas e horários de mercado
const MARKET_SCHEDULE = {
  // Criptomoedas (sempre abertas 24/7)
  'BTCUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Bitcoin vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'ETHUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Ethereum vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'LTCUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Litecoin vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'XRPUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Ripple vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'ADAUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Cardano vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'DOTUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Polkadot vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'LINKUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Chainlink vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  'UNIUSD': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Uniswap vs US Dollar',
    type: 'Crypto',
    market: '24/7',
    alwaysOpen: true
  },
  
  // Sintéticas (sempre abertas)
  'SYNTH1': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Sintético Volatilidade Alta',
    type: 'Synthetic',
    market: '24/7',
    alwaysOpen: true
  },
  'SYNTH2': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Sintético Tendência Bull',
    type: 'Synthetic',
    market: '24/7',
    alwaysOpen: true
  },
  'SYNTH3': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Sintético Tendência Bear',
    type: 'Synthetic',
    market: '24/7',
    alwaysOpen: true
  },
  'SYNTH4': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Sintético Range Trading',
    type: 'Synthetic',
    market: '24/7',
    alwaysOpen: true
  },
  'SYNTH5': { 
    open: '00:00', 
    close: '23:59', 
    timezone: 'UTC',
    description: 'Sintético Momentum',
    type: 'Synthetic',
    market: '24/7',
    alwaysOpen: true
  },
  
  // Forex tradicionais (horário limitado)
  'EURUSD': { 
    open: '08:00', 
    close: '17:00', 
    timezone: 'UTC',
    description: 'Euro vs US Dollar',
    type: 'Forex',
    market: '08:00-17:00 GMT',
    alwaysOpen: false
  },
  'GBPUSD': { 
    open: '08:00', 
    close: '17:00', 
    timezone: 'UTC',
    description: 'British Pound vs US Dollar',
    type: 'Forex',
    market: '08:00-17:00 GMT',
    alwaysOpen: false
  },
  'USDJPY': { 
    open: '00:00', 
    close: '09:00', 
    timezone: 'UTC',
    description: 'US Dollar vs Japanese Yen',
    type: 'Forex',
    market: '00:00-09:00 GMT',
    alwaysOpen: false
  },
  'AUDUSD': { 
    open: '22:00', 
    close: '07:00', 
    timezone: 'UTC',
    description: 'Australian Dollar vs US Dollar',
    type: 'Forex',
    market: '22:00-07:00 GMT',
    alwaysOpen: false
  },
  'USDCAD': { 
    open: '13:00', 
    close: '22:00', 
    timezone: 'UTC',
    description: 'US Dollar vs Canadian Dollar',
    type: 'Forex',
    market: '13:00-22:00 GMT',
    alwaysOpen: false
  },
  'NZDUSD': { 
    open: '22:00', 
    close: '07:00', 
    timezone: 'UTC',
    description: 'New Zealand Dollar vs US Dollar',
    type: 'Forex',
    market: '22:00-07:00 GMT',
    alwaysOpen: false
  },
  'EURGBP': { 
    open: '08:00', 
    close: '17:00', 
    timezone: 'UTC',
    description: 'Euro vs British Pound',
    type: 'Forex',
    market: '08:00-17:00 GMT',
    alwaysOpen: false
  },
  'EURJPY': { 
    open: '00:00', 
    close: '09:00', 
    timezone: 'UTC',
    description: 'Euro vs Japanese Yen',
    type: 'Forex',
    market: '00:00-09:00 GMT',
    alwaysOpen: false
  },
  
  // Commodities (horário limitado)
  'XAUUSD': { 
    open: '01:00', 
    close: '23:00', 
    timezone: 'UTC',
    description: 'Gold vs US Dollar',
    type: 'Commodity',
    market: '01:00-23:00 GMT',
    alwaysOpen: false
  },
  'XAGUSD': { 
    open: '01:00', 
    close: '23:00', 
    timezone: 'UTC',
    description: 'Silver vs US Dollar',
    type: 'Commodity',
    market: '01:00-23:00 GMT',
    alwaysOpen: false
  },
  'USOIL': { 
    open: '01:00', 
    close: '23:00', 
    timezone: 'UTC',
    description: 'Crude Oil WTI',
    type: 'Commodity',
    market: '01:00-23:00 GMT',
    alwaysOpen: false
  },
  'UKOIL': { 
    open: '01:00', 
    close: '23:00', 
    timezone: 'UTC',
    description: 'Brent Crude Oil',
    type: 'Commodity',
    market: '01:00-23:00 GMT',
    alwaysOpen: false
  },
  
  // Índices (horário limitado)
  'US30': { 
    open: '14:30', 
    close: '21:00', 
    timezone: 'UTC',
    description: 'Dow Jones Industrial Average',
    type: 'Index',
    market: '14:30-21:00 GMT',
    alwaysOpen: false
  },
  'US100': { 
    open: '14:30', 
    close: '21:00', 
    timezone: 'UTC',
    description: 'NASDAQ 100',
    type: 'Index',
    market: '14:30-21:00 GMT',
    alwaysOpen: false
  },
  'US500': { 
    open: '14:30', 
    close: '21:00', 
    timezone: 'UTC',
    description: 'S&P 500',
    type: 'Index',
    market: '14:30-21:00 GMT',
    alwaysOpen: false
  },
  'UK100': { 
    open: '08:00', 
    close: '16:30', 
    timezone: 'UTC',
    description: 'FTSE 100',
    type: 'Index',
    market: '08:00-16:30 GMT',
    alwaysOpen: false
  },
  'GER30': { 
    open: '08:00', 
    close: '16:30', 
    timezone: 'UTC',
    description: 'DAX 30',
    type: 'Index',
    market: '08:00-16:30 GMT',
    alwaysOpen: false
  }
};

// Função para verificar se o mercado está aberto
function isMarketOpen(symbol) {
  const config = MARKET_SCHEDULE[symbol];
  if (!config) return false;
  
  // Criptos e sintéticas estão sempre abertas
  if (config.alwaysOpen) return true;
  
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const currentTime = utcHour * 60 + utcMinute; // Converter para minutos
  
  const [openHour, openMinute] = config.open.split(':').map(Number);
  const [closeHour, closeMinute] = config.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  
  // Se o horário de fechamento é no dia seguinte (ex: 22:00-07:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }
  
  // Horário normal no mesmo dia
  return currentTime >= openTime && currentTime <= closeTime;
}

// Função para obter moedas disponíveis
function getAvailableCurrencies() {
  const available = [];
  
  for (const [symbol, config] of Object.entries(MARKET_SCHEDULE)) {
    const isOpen = isMarketOpen(symbol);
    available.push({
      symbol,
      name: config.description,
      description: config.description,
      type: config.type,
      market: config.market,
      status: isOpen ? 'Open' : 'Closed',
      isOpen,
      timezone: config.timezone,
      alwaysOpen: config.alwaysOpen
    });
  }
  
  // Ordenar por tipo e status (sempre abertas primeiro)
  return available.sort((a, b) => {
    // Primeiro: sempre abertas
    if (a.alwaysOpen && !b.alwaysOpen) return -1;
    if (!a.alwaysOpen && b.alwaysOpen) return 1;
    
    // Segundo: por tipo
    const typeOrder = { 'Crypto': 1, 'Synthetic': 2, 'Forex': 3, 'Commodity': 4, 'Index': 5 };
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    
    // Terceiro: por status (abertas primeiro)
    if (a.isOpen && !b.isOpen) return -1;
    if (!a.isOpen && b.isOpen) return 1;
    
    // Por último: alfabeticamente
    return a.symbol.localeCompare(b.symbol);
  });
}

// Função para análise de IA (simulada)
function performAIAnalysis(symbol, timeframe = '1m') {
  // Em uma implementação real, aqui você integraria com:
  // - TensorFlow.js para análise de padrões
  // - APIs de dados históricos
  // - Algoritmos de machine learning
  
  const analysis = {
    symbol,
    timeframe,
    timestamp: new Date().toISOString(),
    signals: {
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: Math.floor(Math.random() * 100) + 1,
      confidence: Math.floor(Math.random() * 100) + 1
    },
    indicators: {
      rsi: Math.floor(Math.random() * 100) + 1,
      macd: {
        signal: Math.random() > 0.5 ? 'buy' : 'sell',
        histogram: (Math.random() - 0.5) * 0.01
      },
      movingAverages: {
        sma20: Math.random() * 2 + 1,
        sma50: Math.random() * 2 + 1,
        ema12: Math.random() * 2 + 1
      }
    },
    recommendation: {
      action: Math.random() > 0.5 ? 'buy' : 'sell',
      entry: Math.random() * 0.01 + 1.0,
      stopLoss: Math.random() * 0.005 + 0.995,
      takeProfit: Math.random() * 0.01 + 1.005,
      riskReward: Math.random() * 2 + 1
    },
    marketConditions: {
      volatility: Math.floor(Math.random() * 100) + 1,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      spread: Math.random() * 0.0001 + 0.0001
    }
  };
  
  return analysis;
}

// Rota para obter moedas disponíveis (sem rate limiting para uso frequente)
router.get('/currencies', tradingMiddleware, (req, res) => {
  try {
    const currencies = getAvailableCurrencies();
    
    res.json({
      status: 'success',
      data: {
        currencies,
        total: currencies.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting currencies:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter moedas disponíveis'
    });
  }
});

// Rota para análise de IA de um símbolo específico
router.post('/analyze', aiAnalysisLimiter, tradingMiddleware, (req, res) => {
  try {
    const { symbol, timeframe = '1m' } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        status: 'error',
        message: 'Símbolo é obrigatório'
      });
    }
    
    if (!MARKET_SCHEDULE[symbol]) {
      return res.status(400).json({
        status: 'error',
        message: 'Símbolo não suportado'
      });
    }
    
    const analysis = performAIAnalysis(symbol, timeframe);
    
    res.json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro na análise de IA'
    });
  }
});

// Rota para obter análise em tempo real
router.get('/realtime/:symbol', tradingMiddleware, (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1m' } = req.query;
    
    if (!MARKET_SCHEDULE[symbol]) {
      return res.status(400).json({
        status: 'error',
        message: 'Símbolo não suportado'
      });
    }
    
    const analysis = performAIAnalysis(symbol, timeframe);
    
    res.json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    console.error('Error in realtime analysis:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro na análise em tempo real'
    });
  }
});

// Rota para obter histórico de análises
router.get('/history/:symbol', tradingMiddleware, (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;
    
    if (!MARKET_SCHEDULE[symbol]) {
      return res.status(400).json({
        status: 'error',
        message: 'Símbolo não suportado'
      });
    }
    
    // Simular histórico de análises
    const history = [];
    for (let i = 0; i < parseInt(limit); i++) {
      const timestamp = new Date(Date.now() - i * 60000); // 1 minuto atrás
      const analysis = performAIAnalysis(symbol, '1m');
      analysis.timestamp = timestamp.toISOString();
      history.push(analysis);
    }
    
    res.json({
      status: 'success',
      data: {
        symbol,
        history,
        total: history.length
      }
    });
  } catch (error) {
    console.error('Error getting analysis history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter histórico de análises'
    });
  }
});

// Rota para configurações de IA
router.get('/settings', tradingMiddleware, (req, res) => {
  try {
    const settings = {
      aiEnabled: true,
      autoTrading: false,
      riskLevel: 'medium',
      maxPositions: 3,
      stopLoss: 0.02,
      takeProfit: 0.04,
      timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
      indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'Bollinger Bands'],
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    };
    
    res.json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    console.error('Error getting AI settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao obter configurações de IA'
    });
  }
});

// Rota para atualizar configurações de IA
router.put('/settings', tradingMiddleware, (req, res) => {
  try {
    const { aiEnabled, autoTrading, riskLevel, maxPositions, stopLoss, takeProfit } = req.body;
    
    // Aqui você salvaria as configurações no banco de dados
    // Por enquanto, apenas retornamos sucesso
    
    res.json({
      status: 'success',
      message: 'Configurações de IA atualizadas com sucesso',
      data: {
        aiEnabled,
        autoTrading,
        riskLevel,
        maxPositions,
        stopLoss,
        takeProfit,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar configurações de IA'
    });
  }
});

module.exports = router;
