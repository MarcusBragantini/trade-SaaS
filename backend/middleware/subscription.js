const User = require('../models/User');

const subscriptionMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se o usuário tem uma assinatura ativa
    if (!user.hasActiveSubscription()) {
      return res.status(403).json({
        status: 'error',
        message: 'Assinatura ativa necessária para acessar este recurso'
      });
    }

    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar assinatura'
    });
  }
};

module.exports = subscriptionMiddleware;