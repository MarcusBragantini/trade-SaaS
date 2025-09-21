const express = require('express');
const router = express.Router();
const AutoTrader = require('../core/autoTrader');
const authMiddleware = require('../middleware/auth');
const { tradingLimiter } = require('../middleware/rateLimiting');

// Armazenar instâncias de traders por usuário
const traders = new Map();

// Middleware para obter trader do usuário
const getTrader = (req, res, next) => {
    const userId = req.user.id;
    
    if (!traders.has(userId)) {
        // Criar novo trader se não existir
        const derivToken = req.user.derivApiToken;
        if (!derivToken) {
            return res.status(400).json({
                status: 'error',
                message: 'Token da Deriv não configurado'
            });
        }
        
        traders.set(userId, new AutoTrader(userId, derivToken));
    }
    
    req.trader = traders.get(userId);
    next();
};

// Iniciar trading automático
router.post('/start', tradingLimiter, authMiddleware, getTrader, async (req, res) => {
    try {
        const { symbol, stake, duration, durationUnit, strategy } = req.body;
        
        // Validações
        if (!symbol || !stake || !duration) {
            return res.status(400).json({
                status: 'error',
                message: 'Parâmetros obrigatórios: symbol, stake, duration'
            });
        }

        if (stake < 1 || stake > 1000) {
            return res.status(400).json({
                status: 'error',
                message: 'Stake deve estar entre 1 e 1000'
            });
        }

        // Configurar trader
        req.trader.configure(symbol, stake, duration, durationUnit || 'm', strategy);
        
        // Conectar se não estiver conectado
        if (!req.trader.isConnected) {
            await req.trader.connect();
        }
        
        // Iniciar trading
        const started = req.trader.startTrading(symbol, stake, duration, durationUnit || 'm');
        
        if (started) {
            res.json({
                status: 'success',
                message: 'Trading automático iniciado',
                data: req.trader.getStatus()
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: 'Falha ao iniciar trading automático'
            });
        }
        
    } catch (error) {
        console.error('Erro ao iniciar trading automático:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Parar trading automático
router.post('/stop', tradingLimiter, authMiddleware, getTrader, (req, res) => {
    try {
        req.trader.stopTrading();
        
        res.json({
            status: 'success',
            message: 'Trading automático parado',
            data: req.trader.getStatus()
        });
        
    } catch (error) {
        console.error('Erro ao parar trading automático:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Obter status do trading
router.get('/status', authMiddleware, getTrader, (req, res) => {
    try {
        const status = req.trader.getStatus();
        
        res.json({
            status: 'success',
            data: status
        });
        
    } catch (error) {
        console.error('Erro ao obter status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Configurar parâmetros
router.post('/configure', tradingLimiter, authMiddleware, getTrader, (req, res) => {
    try {
        const { symbol, stake, duration, durationUnit, strategy } = req.body;
        
        req.trader.configure(symbol, stake, duration, durationUnit, strategy);
        
        res.json({
            status: 'success',
            message: 'Configuração atualizada',
            data: req.trader.getStatus()
        });
        
    } catch (error) {
        console.error('Erro ao configurar:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Obter estratégias disponíveis
router.get('/strategies', authMiddleware, (req, res) => {
    try {
        const StrategyEngine = require('../core/strategy');
        const strategy = new StrategyEngine();
        
        res.json({
            status: 'success',
            data: {
                available: strategy.getAvailableStrategies(),
                current: strategy.currentStrategy
            }
        });
        
    } catch (error) {
        console.error('Erro ao obter estratégias:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Reativar trading (após perdas consecutivas)
router.post('/reactivate', tradingLimiter, authMiddleware, getTrader, (req, res) => {
    try {
        req.trader.riskManager.reactivateTrading();
        
        res.json({
            status: 'success',
            message: 'Trading reativado',
            data: req.trader.getStatus()
        });
        
    } catch (error) {
        console.error('Erro ao reativar trading:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Configurar limites de risco
router.post('/risk-limits', tradingLimiter, authMiddleware, getTrader, (req, res) => {
    try {
        const { maxDailyLoss, maxConsecutiveLosses, maxTradesPerDay } = req.body;
        
        req.trader.riskManager.setLimits(
            maxDailyLoss || 100,
            maxConsecutiveLosses || 3,
            maxTradesPerDay || 50
        );
        
        res.json({
            status: 'success',
            message: 'Limites de risco atualizados',
            data: req.trader.riskManager.getStats()
        });
        
    } catch (error) {
        console.error('Erro ao configurar limites:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Limpar trader (desconectar e remover)
router.delete('/cleanup', authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;
        
        if (traders.has(userId)) {
            const trader = traders.get(userId);
            trader.disconnect();
            traders.delete(userId);
        }
        
        res.json({
            status: 'success',
            message: 'Trader limpo com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao limpar trader:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
