const express = require('express');
const router = express.Router();
const AITrader = require('../core/aiTrader');
const auth = require('../middleware/auth');

// Instância global da IA
const aiTrader = new AITrader();

/**
 * Lista estratégias disponíveis
 * GET /api/v1/ai/strategies
 */
router.get('/strategies', auth, (req, res) => {
  try {
    const strategies = {
      MHI: {
        name: 'Martingale Hi-Lo (MHI)',
        description: 'Estratégia baseada em sequências de cores (vermelho/verde)',
        parameters: ['sequenceLength', 'minConfidence', 'maxConsecutiveLosses'],
        recommended: true
      },
      MACD: {
        name: 'MACD (Moving Average Convergence Divergence)',
        description: 'Análise de convergência e divergência de médias móveis',
        parameters: ['fastPeriod', 'slowPeriod', 'signalPeriod'],
        recommended: true
      },
      BOLLINGER: {
        name: 'Bollinger Bands',
        description: 'Análise de volatilidade usando bandas de Bollinger',
        parameters: ['period', 'stdDev', 'minConfidence'],
        recommended: true
      },
      RSI: {
        name: 'RSI (Relative Strength Index)',
        description: 'Índice de força relativa para identificar sobrecompra/sobrevenda',
        parameters: ['period', 'oversold', 'overbought'],
        recommended: true
      },
      STOCHASTIC: {
        name: 'Stochastic Oscillator',
        description: 'Oscilador estocástico para identificar reversões',
        parameters: ['kPeriod', 'dPeriod', 'oversold', 'overbought'],
        recommended: false
      },
      WILLIAMS: {
        name: 'Williams %R',
        description: 'Indicador de momentum Williams %R',
        parameters: ['period', 'oversold', 'overbought'],
        recommended: false
      },
      MOMENTUM: {
        name: 'Momentum',
        description: 'Análise de momentum de preços',
        parameters: ['period'],
        recommended: false
      },
      MEAN_REVERSION: {
        name: 'Mean Reversion',
        description: 'Estratégia de reversão à média',
        parameters: ['period', 'threshold'],
        recommended: false
      }
    };

    res.json({
      success: true,
      message: 'Estratégias disponíveis obtidas com sucesso',
      data: strategies
    });
  } catch (error) {
    console.error('Erro ao obter estratégias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estratégias',
      error: error.message
    });
  }
});

/**
 * Analisa mercado e gera sinal de trading
 * POST /api/v1/ai/analyze
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const { symbol = 'BTCUSD', strategies = ['MHI', 'MACD', 'RSI', 'BOLLINGER'] } = req.body;
    
    console.log(`🤖 Requisição de análise da IA para ${symbol} com estratégias: ${strategies.join(', ')}`);
    
    // Verificar se a IA já está analisando
    if (aiTrader.isAnalyzing) {
      return res.status(429).json({
        success: false,
        message: 'IA já está analisando o mercado. Tente novamente em alguns segundos.',
        data: null
      });
    }
    
    // Executar análise com estratégias fixas
    const signal = await aiTrader.analyzeWithFixedStrategies(symbol, strategies);
    
    if (!signal) {
      return res.status(500).json({
        success: false,
        message: 'Erro na análise da IA',
        data: null
      });
    }
    
    // Armazenar sinal para referência
    aiTrader.currentSignals.set(symbol, {
      ...signal,
      timestamp: Date.now(),
      userId: req.user.userId
    });
    
    res.json({
      success: true,
      message: 'Análise da IA concluída',
      data: {
        signal,
        analysisTime: new Date().toISOString(),
        aiStatus: aiTrader.getStatus()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na rota de análise da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Executa trade baseado no sinal da IA
 * POST /api/v1/ai/execute-signal
 */
router.post('/execute-signal', auth, async (req, res) => {
  try {
    const { symbol = 'BTCUSD', amount = 5, signalId } = req.body;
    
    console.log(`🎯 Executando trade baseado em sinal da IA: ${symbol}`);
    
    // Buscar sinal armazenado
    const storedSignal = aiTrader.currentSignals.get(symbol);
    
    if (!storedSignal) {
      return res.status(404).json({
        success: false,
        message: 'Sinal da IA não encontrado. Execute uma análise primeiro.',
        data: null
      });
    }
    
    // Verificar se o sinal ainda é válido (não mais que 5 minutos)
    const signalAge = Date.now() - storedSignal.timestamp;
    if (signalAge > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Sinal da IA expirado. Execute uma nova análise.',
        data: null
      });
    }
    
    // Verificar se o sinal recomenda trading
    if (storedSignal.action === 'HOLD') {
      return res.status(400).json({
        success: false,
        message: 'IA recomenda aguardar. Não há sinal de entrada no momento.',
        data: {
          signal: storedSignal,
          reason: 'Sinal de HOLD - aguardar melhor oportunidade'
        }
      });
    }
    
    // Mapear ação da IA para tipo de trade
    const tradeType = storedSignal.action === 'BUY' ? 'CALL' : 'PUT';
    
    // Preparar dados do trade
    const tradeData = {
      pair: symbol,
      type: tradeType,
      amount: amount,
      stopLoss: storedSignal.stopLoss,
      takeProfit: storedSignal.takeProfit,
      aiSignal: {
        confidence: storedSignal.confidence,
        reasoning: storedSignal.reasoning,
        riskLevel: storedSignal.riskLevel,
        aiGenerated: true,
        signalId: signalId || Date.now()
      }
    };
    
    console.log(`🚀 Trade da IA preparado:`, tradeData);
    
    // Executar trade via Deriv
    const derivResponse = await executeDerivTrade(tradeData, req.user);
    
    if (derivResponse.success) {
      // Marcar sinal como executado
      storedSignal.executed = true;
      storedSignal.executionTime = Date.now();
      
      console.log(`✅ Trade da IA executado com sucesso:`, derivResponse.data);
      
      res.json({
        success: true,
        message: 'Trade executado com sucesso baseado no sinal da IA',
        data: {
          trade: derivResponse.data,
          aiSignal: storedSignal,
          executionTime: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erro ao executar trade na Deriv',
        data: {
          error: derivResponse.message,
          aiSignal: storedSignal
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar sinal da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Obtém status e métricas da IA
 * GET /api/v1/ai/status
 */
router.get('/status', auth, (req, res) => {
  try {
    const status = aiTrader.getStatus();
    const performance = aiTrader.getPerformanceMetrics();
    
    res.json({
      success: true,
      message: 'Status da IA obtido com sucesso',
      data: {
        status,
        performance,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter status da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Obtém sinais atuais da IA
 * GET /api/v1/ai/signals
 */
router.get('/signals', auth, (req, res) => {
  try {
    const signals = Array.from(aiTrader.currentSignals.entries()).map(([symbol, signal]) => ({
      symbol,
      ...signal,
      age: Date.now() - signal.timestamp,
      isValid: (Date.now() - signal.timestamp) < (5 * 60 * 1000) // 5 minutos
    }));
    
    res.json({
      success: true,
      message: 'Sinais da IA obtidos com sucesso',
      data: {
        signals,
        totalSignals: signals.length,
        validSignals: signals.filter(s => s.isValid).length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter sinais da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Limpa sinais expirados
 * POST /api/v1/ai/cleanup
 */
router.post('/cleanup', auth, (req, res) => {
  try {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutos
    
    let cleanedCount = 0;
    for (const [symbol, signal] of aiTrader.currentSignals.entries()) {
      if (now - signal.timestamp > maxAge) {
        aiTrader.currentSignals.delete(symbol);
        cleanedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${cleanedCount} sinais expirados removidos`,
      data: {
        cleanedCount,
        remainingSignals: aiTrader.currentSignals.size,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar sinais da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Atualiza resultado do trade na IA
 * POST /api/v1/ai/update-result
 */
router.post('/update-result', auth, (req, res) => {
  try {
    const { tradeId, profit, symbol, aiSignalId } = req.body;
    
    console.log(`📊 Atualizando resultado do trade na IA: ${tradeId}`);
    
    // Atualizar métricas de performance da IA
    aiTrader.updatePerformance({
      id: tradeId,
      profit: profit,
      symbol: symbol,
      timestamp: Date.now()
    });
    
    // Atualizar gerenciador de risco
    if (aiTrader.riskManager) {
      aiTrader.riskManager.updateTradeResult({ profit });
    }
    
    res.json({
      success: true,
      message: 'Resultado do trade atualizado na IA',
      data: {
        tradeId,
        profit,
        updatedMetrics: aiTrader.getPerformanceMetrics(),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar resultado na IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Executa análise contínua (para auto-trading)
 * POST /api/v1/ai/continuous-analysis
 */
router.post('/continuous-analysis', auth, async (req, res) => {
  try {
    const { symbols = ['BTCUSD'], interval = 60000 } = req.body; // 1 minuto padrão
    
    console.log(`🔄 Iniciando análise contínua da IA para: ${symbols.join(', ')}`);
    
    // Verificar se já está em execução
    if (aiTrader.continuousAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Análise contínua já está em execução',
        data: null
      });
    }
    
    // Iniciar análise contínua
    aiTrader.continuousAnalysis = setInterval(async () => {
      for (const symbol of symbols) {
        try {
          const signal = await aiTrader.analyzeMarket(symbol);
          if (signal && signal.action !== 'HOLD') {
            console.log(`🎯 Sinal gerado para ${symbol}:`, signal.action);
            // Em produção, aqui você poderia executar automaticamente ou notificar
          }
        } catch (error) {
          console.error(`❌ Erro na análise contínua de ${symbol}:`, error);
        }
      }
    }, interval);
    
    res.json({
      success: true,
      message: 'Análise contínua iniciada',
      data: {
        symbols,
        interval,
        startedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar análise contínua:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Para análise contínua
 * POST /api/v1/ai/stop-continuous-analysis
 */
router.post('/stop-continuous-analysis', auth, (req, res) => {
  try {
    if (aiTrader.continuousAnalysis) {
      clearInterval(aiTrader.continuousAnalysis);
      aiTrader.continuousAnalysis = null;
      
      res.json({
        success: true,
        message: 'Análise contínua parada',
        data: {
          stoppedAt: new Date().toISOString()
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Análise contínua não estava em execução',
        data: null
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao parar análise contínua:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Função auxiliar para executar trade na Deriv
 */
async function executeDerivTrade(tradeData, user) {
  try {
    // Importar a função diretamente do arquivo deriv.js
    const derivModule = require('./deriv');
    const executeRealTrade = derivModule.executeRealTrade;
    
    // Executar trade via Deriv
    const result = await executeRealTrade(user.deriv_api_token, {
      pair: tradeData.pair,
      type: tradeData.type,
      amount: tradeData.amount,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit
    });
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error('❌ Erro ao executar trade na Deriv:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * @route POST /api/v1/ai-trader/auto-trading/start
 * @desc Inicia trading automático com IA
 * @access Private
 */
router.post('/auto-trading/start', auth, async (req, res) => {
  try {
    const { 
      symbol = 'BTCUSD', 
      strategies = ['MHI', 'MACD', 'RSI'], 
      amount = 5,
      maxTrades = 3,
      interval = 30000 
    } = req.body;
    
    console.log(`🤖 Iniciando auto-trading para ${symbol} com estratégias: ${strategies.join(', ')}`);
    
    // Verificar se já está rodando
    if (aiTrader.isAnalyzing) {
      return res.status(400).json({
        success: false,
        message: 'IA já está analisando. Pare a análise atual primeiro.'
      });
    }
    
    // Iniciar análise contínua
    aiTrader.startContinuousAnalysis(symbol, strategies, interval);
    
    res.json({
      success: true,
      message: 'Auto-trading iniciado com sucesso',
      data: {
        symbol,
        strategies,
        amount,
        maxTrades,
        interval,
        status: 'running'
      }
    });
    
  } catch (error) {
    console.error('Erro ao iniciar auto-trading:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar auto-trading',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/ai-trader/auto-trading/stop
 * @desc Para trading automático
 * @access Private
 */
router.post('/auto-trading/stop', auth, async (req, res) => {
  try {
    console.log('🛑 Parando auto-trading...');
    
    aiTrader.stopContinuousAnalysis();
    
    res.json({
      success: true,
      message: 'Auto-trading parado com sucesso',
      data: {
        status: 'stopped'
      }
    });
    
  } catch (error) {
    console.error('Erro ao parar auto-trading:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao parar auto-trading',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/ai-trader/auto-trading/status
 * @desc Obtém status do auto-trading
 * @access Private
 */
router.get('/auto-trading/status', auth, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Status do auto-trading obtido',
      data: {
        isRunning: aiTrader.isContinuousAnalysisRunning,
        status: aiTrader.isContinuousAnalysisRunning ? 'running' : 'stopped',
        lastAnalysis: aiTrader.lastAnalysisTime,
        totalSignals: aiTrader.performanceMetrics.signalsGenerated,
        executedSignals: aiTrader.performanceMetrics.signalsExecuted
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter status do auto-trading:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do auto-trading',
      error: error.message
    });
  }
});

module.exports = router;
