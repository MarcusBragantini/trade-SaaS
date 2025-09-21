const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  validateUpdateProfile, 
  validateDerivCredentials 
} = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiting');
const router = express.Router();

// Register new user
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    console.log('Existing user check:', existingUser ? 'Exists' : 'Not exists');
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Usuário já existe com este email'
      });
    }

    // Create new user
    console.log('Creating new user...');
    const userId = await User.create({
      name,
      email,
      password
    });

    console.log('User created with ID:', userId);

    // Get the created user
    const user = await User.findById(userId);
    console.log('User retrieved:', user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('JWT token generated');

    res.status(201).json({
      status: 'success',
      message: 'Usuário criado com sucesso',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Login user
router.use((req, res, next) => {
  console.log('\n=== NOVA REQUISIÇÃO AUTH ===');
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  next();
});

// Login user - versão simplificada para debug
router.post('/login', authLimiter, async (req, res) => {
  console.log('=== TENTATIVA DE LOGIN INICIADA ===');
  
  try {
    const { email, password } = req.body;
    console.log('Email recebido:', email);

    if (!email || !password) {
      console.log('Email ou senha faltando');
      return res.status(400).json({
        status: 'error',
        message: 'Email e senha são obrigatórios'
      });
    }

    console.log('Buscando usuário no banco...');
    const user = await User.findByEmail(email);
    console.log('Usuário encontrado:', user ? `Sim (ID: ${user.id})` : 'Não');

    if (!user) {
      console.log('Usuário não existe');
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }

    console.log('Comparando senhas...');
    const storedHash = user.password || user.password_hash;
    if (!storedHash) {
      console.error('Senha hash ausente nas colunas password/password_hash para o usuário:', email);
      return res.status(500).json({
        status: 'error',
        message: 'Configuração de credenciais indisponível. Contate o suporte.'
      });
    }
    const isPasswordValid = await bcrypt.compare(password, storedHash);

    if (!isPasswordValid) {
      console.log('Senha incorreta');
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }

    console.log('Gerando token JWT...');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_123',
      { expiresIn: '24h' }
    );

    console.log('Login bem-sucedido!');
    
    res.json({
      status: 'success',
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          subscription: {
            plan: user.subscription_plan,
            status: user.subscription_status
          },
          balance: user.balance
        },
        token
      }
    });

  } catch (error) {
    console.error('=== ERRO CRÍTICO NO LOGIN ===');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('Tipo:', error.name);
    
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Rota teste para deriv credentials
router.post('/deriv-test', async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Deriv credentials endpoint working'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error testing deriv'
    });
  }
});
// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, validateUpdateProfile, async (req, res) => {
  try {
    const { name, tradingSettings } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (tradingSettings) {
      updates.risk_level = tradingSettings.riskLevel;
      updates.daily_loss_limit = tradingSettings.dailyLossLimit;
      updates.auto_trading = tradingSettings.autoTrading;
      updates.ai_analysis = tradingSettings.aiAnalysis;
    }

    await User.update(user.id, updates);

    // Get updated user
    const updatedUser = await User.findById(user.id);

    res.json({
      status: 'success',
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

// Update Deriv API credentials
router.post('/deriv-credentials', authMiddleware, validateDerivCredentials, async (req, res) => {
  try {
    const { apiToken, appId } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Check if user has active subscription (comentado para permitir teste)
    // if (!user.hasActiveSubscription()) {
    //   return res.status(403).json({
    //     status: 'error',
    //     message: 'Assinatura ativa necessária para configurar credenciais de trading'
    //   });
    // }

    await User.update(user.id, {
      deriv_api_token: apiToken,
      deriv_app_id: appId || process.env.DERIV_APP_ID
    });

    res.json({
      status: 'success',
      message: 'Credenciais Deriv atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Deriv credentials error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;