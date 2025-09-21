const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./utils/database');
const { generalLimiter } = require('./middleware/rateLimiting');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
// const path = require('path');
// Adicione no TOPO do arquivo
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const subscriptionRoutes = require('./routes/subscription');
const adminRoutes = require('./routes/admin');
const derivRoutes = require('./routes/deriv');
const aiAnalysisRoutes = require('./routes/ai-analysis');
const autoTradingRoutes = require('./routes/auto-trading');

// Import middleware
const authMiddleware = require('./middleware/auth');
const subscriptionMiddleware = require('./middleware/subscription');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Stripe webhook must be raw body BEFORE json parser
app.use('/api/v1/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',');
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // flexibiliza em dev
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Aplicar rate limiting geral
app.use('/api', generalLimiter);

// Rate limiting já aplicado acima com generalLimiter

// Middleware de logging
app.use((req, res, next) => {
  console.log('\n=== NOVA REQUISIÇÃO ===');
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', {
    authorization: req.headers.authorization,
    'content-type': req.headers['content-type'],
    origin: req.headers.origin
  });
  console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
// Trading requer autenticação, mas nem todas as rotas exigem assinatura.
// A proteção de assinatura é aplicada por rota dentro de routes/trading.js
app.use('/api/v1/trading', authMiddleware, tradingRoutes);
app.use('/api/v1/subscription', authMiddleware, subscriptionRoutes);
app.use('/api/v1/admin', authMiddleware, adminRoutes);
app.use('/api/v1/deriv', authMiddleware, derivRoutes);
app.use('/api/v1/ai', authMiddleware, aiAnalysisRoutes);
app.use('/api/v1/auto-trading', authMiddleware, autoTradingRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { query } = require('./utils/database');
    await query('SELECT 1');
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const { query } = require('./utils/database');
    const result = await query('SELECT 1 as test');
    res.json({ 
      status: 'success', 
      message: 'Database está funcionando!',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database error',
      error: error.message
    });
  }
});

// Initialize WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request) => {
  console.log('✅ Nova conexão WebSocket estabelecida');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem WebSocket:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('❌ Conexão WebSocket fechada');
  });
});

// Handle WebSocket messages
function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'auth':
      handleAuth(ws, data);
      break;
    case 'subscribe_prices':
      handlePriceSubscription(ws, data);
      break;
    case 'execute_trade':
      handleTradeExecution(ws, data);
      break;
    case 'close_position':
      handlePositionClose(ws, data);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

// Handle WebSocket authentication
function handleAuth(ws, data) {
  try {
    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
    ws.userId = decoded.userId;
    ws.send(JSON.stringify({ type: 'auth_success', message: 'Authenticated successfully' }));
  } catch (error) {
    ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication failed' }));
    ws.close();
  }
}

// Start server
async function startServer() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    await initializeDatabase();
    console.log('✅ Banco de dados inicializado');
    
    const server = app.listen(PORT, () => {
      console.log(`
==================================================
🚀 ForexAI Trading SaaS Backend
==================================================
📡 Servidor rodando em: http://localhost:${PORT}
🌐 Ambiente: ${process.env.NODE_ENV}
📊 Banco de Dados: MySQL
📊 WebSocket: Ativado
🔌 Deriv Integration: ${process.env.DERIV_APP_ID ? 'Ativado' : 'Desativado'}
💳 Sistema de Pagamento: ${process.env.STRIPE_SECRET_KEY ? 'Ativado' : 'Desativado'}
==================================================
      `);
    });

    // Upgrade HTTP server to handle WebSockets
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    console.error('❌ Falha crítica ao iniciar o servidor:', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = {
  app,
  startServer
};