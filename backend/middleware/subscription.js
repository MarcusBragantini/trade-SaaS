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
        message: 'Assinatura ativa necessária para acessar este recurso',
        subscription: {
          status: user.subscription_status,
          currentPeriodEnd: user.current_period_end,
          isActive: user.hasActiveSubscription()
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar assinatura'
    });
  }
};

        // Middleware específico para trading (simplificado para desenvolvimento)
        const tradingMiddleware = async (req, res, next) => {
          try {
            const user = await User.findById(req.userId);
            
            if (!user) {
              return res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
              });
            }

            // Para desenvolvimento, permitir trading sem validações rigorosas
            console.log('🔓 Trading permitido para desenvolvimento - usuário:', user.id);
            
            req.user = user;
            next();
          } catch (error) {
            console.error('Trading middleware error:', error);
            res.status(500).json({
              status: 'error',
              message: 'Erro interno do servidor'
            });
          }
        };

module.exports = { subscriptionMiddleware, tradingMiddleware };