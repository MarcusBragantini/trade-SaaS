const Joi = require('joi');

// Schema de validação para registro de usuário
const registrationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'O nome é obrigatório',
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 100 caracteres'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'O email é obrigatório',
      'string.email': 'Por favor, informe um email válido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'A senha é obrigatória',
      'string.min': 'A senha deve ter pelo menos 6 caracteres'
    })
});

// Schema de validação para login
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'O email é obrigatório',
      'string.email': 'Por favor, informe um email válido'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'A senha é obrigatória'
    })
});

// Schema de validação para atualização de perfil
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'O nome deve ter pelo menos 2 caracteres',
      'string.max': 'O nome deve ter no máximo 100 caracteres'
    }),
  tradingSettings: Joi.object({
    riskLevel: Joi.string()
      .valid('low', 'medium', 'high')
      .optional(),
    dailyLossLimit: Joi.number()
      .min(0)
      .max(10000)
      .optional(),
    autoTrading: Joi.boolean()
      .optional(),
    aiAnalysis: Joi.boolean()
      .optional()
  }).optional()
});

// Schema de validação para credenciais Deriv
const derivCredentialsSchema = Joi.object({
  apiToken: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.min': 'O token da API deve ter pelo menos 10 caracteres'
    }),
  apiTokenReal: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.min': 'O token Real deve ter pelo menos 10 caracteres'
    }),
  apiTokenDemo: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.min': 'O token Demo deve ter pelo menos 10 caracteres'
    }),
  appId: Joi.string()
    .optional()
    .allow('')
}).or('apiToken', 'apiTokenReal', 'apiTokenDemo');

// Middleware de validação para registro
const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
  
  next();
};

// Middleware de validação para login
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
  
  next();
};

// Middleware de validação para atualização de perfil
const validateUpdateProfile = (req, res, next) => {
  const { error } = updateProfileSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
  
  next();
};

// Middleware de validação para credenciais Deriv
const validateDerivCredentials = (req, res, next) => {
  const { error } = derivCredentialsSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
  
  next();
};

// Schema de validação para execução de trades
const tradeExecutionSchema = Joi.object({
  pair: Joi.string()
    .valid('EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD')
    .required()
    .messages({
      'string.empty': 'O par de moedas é obrigatório',
      'any.only': 'Par de moedas inválido'
    }),
  type: Joi.string()
    .valid('BUY', 'SELL', 'CALL', 'PUT')
    .required()
    .messages({
      'string.empty': 'O tipo de operação é obrigatório',
      'any.only': 'Tipo de operação inválido'
    }),
  amount: Joi.number()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.base': 'O valor deve ser um número',
      'number.min': 'O valor mínimo é 1',
      'number.max': 'O valor máximo é 10000'
    }),
  stopLoss: Joi.number()
    .min(0)
    .optional(),
  takeProfit: Joi.number()
    .min(0)
    .optional()
});

// Middleware de validação para execução de trades
const validateTradeExecution = (req, res, next) => {
  const { error } = tradeExecutionSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
  
  next();
};

// Schema de validação para assinaturas
const subscriptionSchema = Joi.object({
  planId: Joi.string()
    .valid('free', 'basic', 'pro', 'enterprise')
    .required()
    .messages({
      'string.empty': 'O ID do plano é obrigatório',
      'any.only': 'Plano inválido'
    }),
  interval: Joi.string()
    .valid('monthly', 'yearly')
    .default('monthly')
    .messages({
      'any.only': 'Intervalo inválido'
    })
});

// Middleware de validação para assinaturas
const validateSubscription = (req, res, next) => {
  const { error } = subscriptionSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      status: 'error',
      message: errorMessage
    });
  }
  
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  validateDerivCredentials,
  validateTradeExecution,
  validateSubscription
};