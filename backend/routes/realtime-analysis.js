const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AITrader = require('../core/aiTrader');

// Instância global do AITrader
const aiTrader = new AITrader();

// Iniciar análise em tempo real
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const { intervalSeconds = 10, symbols = ['R_10', 'R_25', 'R_50'] } = req.body;
        
        aiTrader.startRealtimeAnalysis(intervalSeconds, symbols);
        
        res.json({
            status: 'success',
            message: 'Análise em tempo real iniciada',
            data: {
                interval: intervalSeconds,
                symbols: symbols
            }
        });
        
    } catch (error) {
        console.error('Erro ao iniciar análise em tempo real:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Parar análise em tempo real
router.post('/stop', authMiddleware, async (req, res) => {
    try {
        aiTrader.stopRealtimeAnalysis();
        
        res.json({
            status: 'success',
            message: 'Análise em tempo real parada'
        });
        
    } catch (error) {
        console.error('Erro ao parar análise em tempo real:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Obter status da análise em tempo real
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const status = aiTrader.getRealtimeAnalysisStatus();
        
        res.json({
            status: 'success',
            data: status
        });
        
    } catch (error) {
        console.error('Erro ao obter status da análise:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Obter última análise
router.get('/last-analysis', authMiddleware, async (req, res) => {
    try {
        const status = aiTrader.getRealtimeAnalysisStatus();
        
        res.json({
            status: 'success',
            data: {
                lastAnalysis: status.lastAnalysis,
                isActive: status.isActive
            }
        });
        
    } catch (error) {
        console.error('Erro ao obter última análise:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// WebSocket para análise em tempo real (simulado com polling)
router.get('/stream', authMiddleware, async (req, res) => {
    try {
        // Configurar SSE (Server-Sent Events)
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Função para enviar dados
        const sendData = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Adicionar subscriber
        aiTrader.subscribeToRealtimeAnalysis(sendData);

        // Enviar status inicial
        sendData({
            type: 'status',
            data: aiTrader.getRealtimeAnalysisStatus()
        });

        // Limpar subscriber quando conexão for fechada
        req.on('close', () => {
            aiTrader.unsubscribeFromRealtimeAnalysis(sendData);
        });

    } catch (error) {
        console.error('Erro no stream de análise:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
