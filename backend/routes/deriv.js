const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const User = require('../models/User');
const router = express.Router();

// Deriv API configuration
const DERIV_API_URL = process.env.DERIV_API_URL || 'wss://ws.binaryws.com/websockets/v3';
let derivWS = null;
const connectedUsers = new Map(); // Mapa para armazenar conexões por usuário

// Initialize Deriv WebSocket connection for a specific user
function initDerivConnection(userId, apiToken) {
  if (connectedUsers.has(userId)) {
    console.log(`✅ Usuário ${userId} já está conectado à Deriv`);
    return;
  }

  const userWS = new WebSocket(DERIV_API_URL);

  userWS.on('open', () => {
    console.log(`✅ Conectado à API Deriv para usuário ${userId}`);
    
    // Send authorization with user's API token
    if (apiToken) {
      userWS.send(JSON.stringify({
        authorize: apiToken
      }));
    }
  });

  userWS.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.error) {
        console.error(`Erro Deriv para usuário ${userId}:`, message.error);
        return;
      }
      
      if (message.authorize) {
        console.log(`✅ Usuário ${userId} autorizado na Deriv`);
      }
      
      // Aqui você pode processar outras mensagens recebidas
      
    } catch (error) {
      console.error('Erro ao processar mensagem Deriv:', error);
    }
  });

  userWS.on('error', (error) => {
    console.error(`Deriv WebSocket error para usuário ${userId}:`, error);
  });

  userWS.on('close', () => {
    console.log(`❌ Conexão Deriv fechada para usuário ${userId}`);
    connectedUsers.delete(userId);
    
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      if (apiToken) {
        initDerivConnection(userId, apiToken);
      }
    }, 5000);
  });

  connectedUsers.set(userId, userWS);
}

// Close Deriv connection for a user
function closeDerivConnection(userId) {
  if (connectedUsers.has(userId)) {
    const userWS = connectedUsers.get(userId);
    userWS.close();
    connectedUsers.delete(userId);
    console.log(`❌ Conexão Deriv fechada para usuário ${userId}`);
  }
}

// Get Deriv assets
router.get('/assets', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.deriv_api_token) {
      return res.status(403).json({
        status: 'error',
        message: 'Credenciais Deriv não configuradas. Configure seu token API nas configurações.'
      });
    }

    // Inicializar conexão para este usuário
    initDerivConnection(user.id, user.deriv_api_token);

    // Lista de ativos populares na Deriv
    const assets = [
      { symbol: 'frxEURUSD', name: 'Euro/US Dollar', market: 'forex' },
      { symbol: 'frxGBPUSD', name: 'British Pound/US Dollar', market: 'forex' },
      { symbol: 'frxUSDJPY', name: 'US Dollar/Japanese Yen', market: 'forex' },
      { symbol: 'frxAUDUSD', name: 'Australian Dollar/US Dollar', market: 'forex' },
      { symbol: 'frxUSDCAD', name: 'US Dollar/Canadian Dollar', market: 'forex' },
      { symbol: 'R_50', name: 'Volatility 50 Index', market: 'synthetic' },
      { symbol: 'R_75', name: 'Volatility 75 Index', market: 'synthetic' },
      { symbol: 'R_100', name: 'Volatility 100 Index', market: 'synthetic' }
    ];

    res.json({
      status: 'success',
      data: assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar ativos'
    });
  }
});

// Get asset prices (simulado - na prática você usaria a conexão WebSocket)
router.get('/prices/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const user = await User.findById(req.userId);
    
    if (!user || !user.deriv_api_token) {
      return res.status(403).json({
        status: 'error',
        message: 'Credenciais Deriv não configuradas'
      });
    }

    // Dados simulados - na prática você obteria isso da conexão WebSocket
    const prices = {
      symbol: symbol,
      bid: (Math.random() * 0.5 + 1.0).toFixed(5),
      ask: (Math.random() * 0.5 + 1.0 + 0.0001).toFixed(5),
      spread: (0.0001).toFixed(5),
      timestamp: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: prices
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar preços'
    });
  }
});

// Get account balance from Deriv
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.deriv_api_token) {
      return res.status(403).json({
        status: 'error',
        message: 'Credenciais Deriv não configuradas'
      });
    }

    // Dados simulados - na prática você faria uma requisição à API Deriv
    const balance = {
      balance: 10000.00,
      currency: 'USD',
      available: 9500.00,
      deposited: 10500.00,
      withdrawn: 500.00,
      profit: 150.50
    };

    res.json({
      status: 'success',
      data: balance
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar saldo'
    });
  }
});

// Check Deriv connection status
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const hasCredentials = user && user.deriv_api_token;
    const isConnected = hasCredentials && connectedUsers.has(user.id);

    res.json({
      status: 'success',
      data: {
        connected: isConnected,
        hasCredentials,
        message: hasCredentials ? 
          (isConnected ? 'Conectado à Deriv' : 'Desconectado da Deriv') :
          'Token API não configurado'
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar status'
    });
  }
});

// Test Deriv connection
router.post('/test-connection', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.deriv_api_token) {
      return res.status(403).json({
        status: 'error',
        message: 'Token API não configurado'
      });
    }

    // Fechar conexão existente se houver
    if (connectedUsers.has(user.id)) {
      closeDerivConnection(user.id);
    }

    // Iniciar nova conexão
    initDerivConnection(user.id, user.deriv_api_token);

    res.json({
      status: 'success',
      message: 'Conexão com Deriv iniciada. Verifique o status em alguns segundos.'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar conexão'
    });
  }
});

// Get active symbols
router.get('/active-symbols', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.deriv_api_token) {
      return res.status(403).json({
        status: 'error',
        message: 'Credenciais Deriv não configuradas'
      });
    }

    // Símbolos ativos populares na Deriv
    const activeSymbols = [
      { symbol: 'frxEURUSD', display_name: 'EUR/USD', market: 'forex' },
      { symbol: 'frxGBPUSD', display_name: 'GBP/USD', market: 'forex' },
      { symbol: 'frxUSDJPY', display_name: 'USD/JPY', market: 'forex' },
      { symbol: 'frxAUDUSD', display_name: 'AUD/USD', market: 'forex' },
      { symbol: 'frxUSDCAD', display_name: 'USD/CAD', market: 'forex' },
      { symbol: 'R_50', display_name: 'Volatility 50', market: 'synthetic' },
      { symbol: 'R_75', display_name: 'Volatility 75', market: 'synthetic' },
      { symbol: 'R_100', display_name: 'Volatility 100', market: 'synthetic' },
      { symbol: '1HZ100V', display_name: 'Volatility 100 (1s)', market: 'synthetic' }
    ];

    res.json({
      status: 'success',
      data: activeSymbols
    });
  } catch (error) {
    console.error('Get active symbols error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao carregar símbolos ativos'
    });
  }
});

module.exports = router;