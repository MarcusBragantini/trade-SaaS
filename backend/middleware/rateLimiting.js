const rateLimit = require('express-rate-limit');

// Rate limiting para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP por janela
  message: {
    status: 'error',
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // não contar tentativas bem-sucedidas
});

// Rate limiting para análise de IA (mais permissivo)
const aiAnalysisLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 análises por minuto (aumentado de 10)
  message: {
    status: 'error',
    message: 'Muitas análises de IA. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para trading (mais permissivo)
const tradingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // máximo 50 operações por minuto (aumentado de 20)
  message: {
    status: 'error',
    message: 'Muitas operações de trading. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting geral (muito mais permissivo)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requisições por IP por janela (aumentado de 100)
  message: {
    status: 'error',
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  aiAnalysisLimiter,
  tradingLimiter,
  generalLimiter
};
