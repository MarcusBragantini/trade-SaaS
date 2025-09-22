const axios = require('axios');
const TradingStrategies = require('./strategies');
const MarketDataFetcher = require('./marketData');
const TechnicalAnalysis = require('./technicalAnalysis');

class AITrader {
  constructor() {
    this.isAnalyzing = false;
    this.currentSignals = new Map();
    this.marketData = new Map();
    this.performanceMetrics = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0
    };
    this.riskManager = new RiskManager();
    this.strategyEngine = new StrategyEngine();
    this.tradingStrategies = new TradingStrategies();
    this.marketDataFetcher = new MarketDataFetcher();
    this.technicalAnalysis = new TechnicalAnalysis();
    
    // Sistema de análise em tempo real
    this.realtimeAnalysis = {
      isActive: false,
      interval: null,
      lastAnalysis: null,
      currentMarketSentiment: 'NEUTRAL',
      activeSignals: [],
      marketTrend: 'SIDEWAYS',
      analysisCount: 0,
      subscribers: new Set()
    };
  }

  /**
   * Analisa o mercado usando estratégias fixas (MHI, MACD, RSI, etc.)
   */
  async analyzeWithFixedStrategies(symbol, selectedStrategies = ['MHI', 'MACD', 'RSI', 'BOLLINGER']) {
    console.log(`🤖 Analisando ${symbol} com estratégias fixas: ${selectedStrategies.join(', ')}`);
    
    try {
      // Gerar dados de mercado simulados (em produção, usar dados reais)
      const marketData = await this.generateMarketData(symbol);
      
      // Executar análise com estratégias selecionadas
      const result = this.tradingStrategies.analyzeWithStrategies(marketData, selectedStrategies);
      
      // Adicionar informações extras
      result.symbol = symbol;
      result.timestamp = new Date().toISOString();
      result.strategiesUsed = selectedStrategies;
      
      console.log(`✅ Análise com estratégias fixas concluída para ${symbol}:`, result.action);
      return result;
      
    } catch (error) {
      console.error(`❌ Erro na análise com estratégias fixas para ${symbol}:`, error);
      return {
        action: 'HOLD',
        confidence: 0.1,
        reason: `Erro na análise: ${error.message}`,
        symbol,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Gera dados de mercado simulados para teste das estratégias
   */
  async generateMarketData(symbol, periods = 100) {
    const marketData = [];
    let basePrice = 50000; // Preço base para simulação
    
    for (let i = 0; i < periods; i++) {
      // Simular variação de preço
      const variation = (Math.random() - 0.5) * 0.02; // ±1% de variação
      const open = basePrice;
      const close = open * (1 + variation);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      
      marketData.push({
        open,
        high,
        low,
        close,
        volume: 1000 + Math.random() * 500,
        timestamp: new Date(Date.now() - (periods - i) * 60000).toISOString()
      });
      
      basePrice = close;
    }
    
    return marketData;
  }

  /**
   * Analisa o mercado e gera sinais de trading
   */
  async analyzeMarket(symbol = 'BTCUSD') {
    if (this.isAnalyzing) return null;
    
    this.isAnalyzing = true;
    console.log(`🤖 IA analisando mercado: ${symbol}`);
    
    try {
      // 1. Coletar dados de mercado
      const marketData = await this.collectMarketData(symbol);
      
      // 2. Aplicar indicadores técnicos
      const technicalAnalysis = await this.performTechnicalAnalysis(marketData);
      
      // 3. Análise de sentimento
      const sentimentAnalysis = await this.analyzeSentiment(symbol);
      
      // 4. Análise de padrões
      const patternAnalysis = await this.analyzePatterns(marketData);
      
      // 5. Gerar sinal final
      const tradingSignal = await this.generateTradingSignal({
        symbol,
        technical: technicalAnalysis,
        sentiment: sentimentAnalysis,
        patterns: patternAnalysis,
        marketData
      });
      
      // 6. Aplicar gerenciamento de risco
      const riskAdjustedSignal = this.riskManager.adjustSignal(tradingSignal);
      
      console.log(`🎯 Sinal gerado pela IA:`, {
        symbol: riskAdjustedSignal.symbol,
        action: riskAdjustedSignal.action,
        confidence: riskAdjustedSignal.confidence,
        entryPrice: riskAdjustedSignal.entryPrice,
        stopLoss: riskAdjustedSignal.stopLoss,
        takeProfit: riskAdjustedSignal.takeProfit,
        reasoning: riskAdjustedSignal.reasoning
      });
      
      return riskAdjustedSignal;
      
    } catch (error) {
      console.error('❌ Erro na análise da IA:', error);
      return null;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Coleta dados de mercado de múltiplas fontes
   */
  async collectMarketData(symbol) {
    const data = {
      symbol,
      timestamp: Date.now(),
      price: null,
      volume: null,
      volatility: null,
      trends: [],
      support: null,
      resistance: null
    };

    try {
      // Simular coleta de dados (em produção, usar APIs reais)
      const mockData = this.generateMockMarketData(symbol);
      
      // Em produção, integrar com:
      // - Deriv API para dados em tempo real
      // - Binance API para volume e tendências
      // - TradingView para indicadores avançados
      // - News APIs para sentiment
      
      return { ...data, ...mockData };
      
    } catch (error) {
      console.error('Erro ao coletar dados de mercado:', error);
      return data;
    }
  }

  /**
   * Realiza análise técnica avançada
   */
  async performTechnicalAnalysis(marketData) {
    const analysis = {
      rsi: this.calculateRSI(marketData.prices),
      macd: this.calculateMACD(marketData.prices),
      bollinger: this.calculateBollingerBands(marketData.prices),
      movingAverages: this.calculateMovingAverages(marketData.prices),
      volumeProfile: this.analyzeVolumeProfile(marketData.volume),
      momentum: this.calculateMomentum(marketData.prices),
      trend: this.determineTrend(marketData.prices),
      strength: 0
    };

    // Calcular força geral do sinal
    analysis.strength = this.calculateSignalStrength(analysis);
    
    return analysis;
  }

  /**
   * Analisa sentimento do mercado
   */
  async analyzeSentiment(symbol) {
    // Em produção, integrar com:
    // - News APIs (Reuters, Bloomberg)
    // - Social media sentiment (Twitter, Reddit)
    // - Fear & Greed Index
    // - Options flow data
    
    return {
      sentiment: 'neutral', // bullish, bearish, neutral
      confidence: 0.6,
      newsImpact: 'neutral',
      socialSentiment: 'neutral',
      fearGreedIndex: 50
    };
  }

  /**
   * Analisa padrões de preço
   */
  async analyzePatterns(marketData) {
    return {
      chartPatterns: this.detectChartPatterns(marketData),
      candlestickPatterns: this.detectCandlestickPatterns(marketData),
      supportResistance: this.identifySupportResistance(marketData),
      breakouts: this.detectBreakouts(marketData)
    };
  }

  /**
   * Gera sinal de trading final
   */
  async generateTradingSignal(analysisData) {
    const { technical, sentiment, patterns, marketData } = analysisData;
    
    // Algoritmo de decisão baseado em múltiplos fatores
    let signal = {
      symbol: marketData.symbol,
      action: 'HOLD', // BUY, SELL, HOLD
      confidence: 0,
      entryPrice: marketData.price,
      stopLoss: null,
      takeProfit: null,
      reasoning: [],
      riskLevel: 'MEDIUM'
    };

    // 1. Análise técnica (peso 40%)
    const technicalScore = this.evaluateTechnicalScore(technical);
    signal.reasoning.push(`Análise técnica: ${technicalScore.score}/10 (${technicalScore.summary})`);

    // 2. Análise de sentimento (peso 20%)
    const sentimentScore = this.evaluateSentimentScore(sentiment);
    signal.reasoning.push(`Sentimento: ${sentimentScore.summary}`);

    // 3. Análise de padrões (peso 30%)
    const patternScore = this.evaluatePatternScore(patterns);
    signal.reasoning.push(`Padrões: ${patternScore.summary}`);

    // 4. Confluência de sinais (peso 10%)
    const confluenceScore = this.evaluateConfluence(technical, sentiment, patterns);
    signal.reasoning.push(`Confluência: ${confluenceScore.summary}`);

    // Calcular score final
    const finalScore = (
      technicalScore.score * 0.4 +
      sentimentScore.score * 0.2 +
      patternScore.score * 0.3 +
      confluenceScore.score * 0.1
    );

    // Determinar ação baseada no score
    if (finalScore >= 7) {
      signal.action = 'BUY';
      signal.confidence = finalScore / 10;
    } else if (finalScore <= 3) {
      signal.action = 'SELL';
      signal.confidence = (10 - finalScore) / 10;
    } else {
      signal.action = 'HOLD';
      signal.confidence = 0.5;
    }

    // Calcular stop loss e take profit
    if (signal.action !== 'HOLD') {
      const riskReward = this.calculateRiskReward(marketData, signal.action);
      signal.stopLoss = riskReward.stopLoss;
      signal.takeProfit = riskReward.takeProfit;
      signal.riskLevel = riskReward.riskLevel;
    }

    signal.reasoning.push(`Score final: ${finalScore.toFixed(1)}/10`);
    signal.reasoning.push(`Ação recomendada: ${signal.action}`);
    signal.reasoning.push(`Confiança: ${(signal.confidence * 100).toFixed(1)}%`);

    return signal;
  }

  /**
   * Avalia score técnico
   */
  evaluateTechnicalScore(technical) {
    let score = 5; // Score neutro
    
    // RSI
    if (technical.rsi < 30) score += 2; // Oversold
    else if (technical.rsi > 70) score -= 2; // Overbought
    
    // MACD
    if (technical.macd.histogram > 0) score += 1;
    else score -= 1;
    
    // Tendência
    if (technical.trend === 'bullish') score += 2;
    else if (technical.trend === 'bearish') score -= 2;
    
    // Bollinger Bands
    if (technical.bollinger.position === 'lower') score += 1;
    else if (technical.bollinger.position === 'upper') score -= 1;
    
    score = Math.max(0, Math.min(10, score));
    
    return {
      score,
      summary: score >= 6 ? 'Positivo' : score <= 4 ? 'Negativo' : 'Neutro'
    };
  }

  /**
   * Avalia score de sentimento
   */
  evaluateSentimentScore(sentiment) {
    let score = 5;
    
    if (sentiment.sentiment === 'bullish') score += 2;
    else if (sentiment.sentiment === 'bearish') score -= 2;
    
    if (sentiment.confidence > 0.7) score += 1;
    else if (sentiment.confidence < 0.3) score -= 1;
    
    score = Math.max(0, Math.min(10, score));
    
    return {
      score,
      summary: sentiment.sentiment
    };
  }

  /**
   * Avalia score de padrões
   */
  evaluatePatternScore(patterns) {
    let score = 5;
    
    // Detectar padrões bullish
    const bullishPatterns = patterns.chartPatterns.filter(p => p.type === 'bullish').length;
    const bearishPatterns = patterns.chartPatterns.filter(p => p.type === 'bearish').length;
    
    score += bullishPatterns - bearishPatterns;
    
    score = Math.max(0, Math.min(10, score));
    
    return {
      score,
      summary: score >= 6 ? 'Padrões bullish' : score <= 4 ? 'Padrões bearish' : 'Padrões neutros'
    };
  }

  /**
   * Avalia confluência de sinais
   */
  evaluateConfluence(technical, sentiment, patterns) {
    const signals = [];
    
    if (technical.strength > 0.6) signals.push('technical_bullish');
    if (technical.strength < 0.4) signals.push('technical_bearish');
    
    if (sentiment.sentiment === 'bullish') signals.push('sentiment_bullish');
    if (sentiment.sentiment === 'bearish') signals.push('sentiment_bearish');
    
    const bullishCount = signals.filter(s => s.includes('bullish')).length;
    const bearishCount = signals.filter(s => s.includes('bearish')).length;
    
    let score = 5;
    if (bullishCount > bearishCount) score += 2;
    if (bearishCount > bullishCount) score -= 2;
    
    return {
      score,
      summary: `Confluência: ${bullishCount} bullish, ${bearishCount} bearish`
    };
  }

  /**
   * Calcula risco e recompensa
   */
  calculateRiskReward(marketData, action) {
    const currentPrice = marketData.price;
    const volatility = marketData.volatility || 0.02; // 2% padrão
    
    let stopLoss, takeProfit, riskLevel;
    
    if (action === 'BUY') {
      stopLoss = currentPrice * (1 - volatility * 2);
      takeProfit = currentPrice * (1 + volatility * 3);
      riskLevel = 'MEDIUM';
    } else if (action === 'SELL') {
      stopLoss = currentPrice * (1 + volatility * 2);
      takeProfit = currentPrice * (1 - volatility * 3);
      riskLevel = 'HIGH';
    }
    
    return { stopLoss, takeProfit, riskLevel };
  }

  /**
   * Atualiza métricas de performance
   */
  updatePerformance(tradeResult) {
    this.performanceMetrics.totalTrades++;
    
    if (tradeResult.profit > 0) {
      this.performanceMetrics.winningTrades++;
      this.performanceMetrics.averageWin = 
        (this.performanceMetrics.averageWin * (this.performanceMetrics.winningTrades - 1) + tradeResult.profit) / 
        this.performanceMetrics.winningTrades;
    } else {
      this.performanceMetrics.losingTrades++;
      this.performanceMetrics.averageLoss = 
        (this.performanceMetrics.averageLoss * (this.performanceMetrics.losingTrades - 1) + Math.abs(tradeResult.profit)) / 
        this.performanceMetrics.losingTrades;
    }
    
    this.performanceMetrics.totalProfit += tradeResult.profit;
    this.performanceMetrics.winRate = this.performanceMetrics.winningTrades / this.performanceMetrics.totalTrades;
    
    if (this.performanceMetrics.averageLoss > 0) {
      this.performanceMetrics.profitFactor = this.performanceMetrics.averageWin / this.performanceMetrics.averageLoss;
    }
    
    console.log('📊 Métricas da IA atualizadas:', this.performanceMetrics);
  }

  /**
   * Métodos auxiliares para cálculos técnicos
   */
  calculateRSI(prices) {
    // Implementação simplificada do RSI
    if (prices.length < 14) return 50;
    
    let gains = 0, losses = 0;
    for (let i = 1; i < 14; i++) {
      const change = prices[i] - prices[i-1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    // Implementação simplificada do MACD
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    return {
      macd: ema12 - ema26,
      signal: this.calculateEMA([ema12 - ema26], 9),
      histogram: (ema12 - ema26) - this.calculateEMA([ema12 - ema26], 9)
    };
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateBollingerBands(prices) {
    if (prices.length < 20) return { upper: 0, middle: 0, lower: 0, position: 'middle' };
    
    const sma = prices.slice(-20).reduce((a, b) => a + b) / 20;
    const variance = prices.slice(-20).reduce((a, b) => a + Math.pow(b - sma, 2)) / 20;
    const stdDev = Math.sqrt(variance);
    
    const upper = sma + (stdDev * 2);
    const lower = sma - (stdDev * 2);
    const currentPrice = prices[prices.length - 1];
    
    let position = 'middle';
    if (currentPrice > upper) position = 'upper';
    else if (currentPrice < lower) position = 'lower';
    
    return { upper, middle: sma, lower, position };
  }

  calculateMovingAverages(prices) {
    const sma20 = prices.length >= 20 ? prices.slice(-20).reduce((a, b) => a + b) / 20 : null;
    const sma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b) / 50 : null;
    
    return { sma20, sma50 };
  }

  calculateMomentum(prices) {
    if (prices.length < 10) return 0;
    return ((prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]) * 100;
  }

  determineTrend(prices) {
    if (prices.length < 20) return 'neutral';
    
    const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;
    const currentPrice = prices[prices.length - 1];
    
    if (currentPrice > sma20 * 1.02) return 'bullish';
    if (currentPrice < sma20 * 0.98) return 'bearish';
    return 'neutral';
  }

  calculateSignalStrength(analysis) {
    let strength = 0.5; // Neutro
    
    // RSI
    if (analysis.rsi < 30 || analysis.rsi > 70) strength += 0.1;
    
    // MACD
    if (Math.abs(analysis.macd.histogram) > 0.5) strength += 0.1;
    
    // Tendência
    if (analysis.trend === 'bullish') strength += 0.2;
    else if (analysis.trend === 'bearish') strength -= 0.2;
    
    return Math.max(0, Math.min(1, strength));
  }

  analyzeVolumeProfile(volume) {
    // Análise simplificada de volume
    return {
      average: volume || 1000000,
      trend: 'normal',
      significance: 'medium'
    };
  }

  detectChartPatterns(marketData) {
    // Detecção simplificada de padrões
    return [
      { type: 'bullish', pattern: 'double_bottom', confidence: 0.7 },
      { type: 'bearish', pattern: 'head_shoulders', confidence: 0.6 }
    ];
  }

  detectCandlestickPatterns(marketData) {
    // Detecção de padrões de candlestick
    return [
      { type: 'bullish', pattern: 'hammer', confidence: 0.8 },
      { type: 'bearish', pattern: 'doji', confidence: 0.6 }
    ];
  }

  identifySupportResistance(marketData) {
    // Identificação de suporte e resistência
    return {
      support: marketData.price * 0.95,
      resistance: marketData.price * 1.05,
      strength: 'medium'
    };
  }

  detectBreakouts(marketData) {
    // Detecção de breakouts
    return {
      type: 'none',
      direction: 'neutral',
      volume: 'normal'
    };
  }

  generateMockMarketData(symbol) {
    // Dados simulados para desenvolvimento
    const basePrice = symbol === 'BTCUSD' ? 5844 : 100;
    const volatility = 0.02;
    
    return {
      price: basePrice + (Math.random() - 0.5) * basePrice * volatility,
      volume: 1000000 + Math.random() * 500000,
      volatility: volatility,
      prices: Array.from({ length: 100 }, (_, i) => 
        basePrice + (Math.random() - 0.5) * basePrice * volatility * (i / 100)
      ),
      trends: ['short_term_bullish', 'medium_term_neutral'],
      support: basePrice * 0.95,
      resistance: basePrice * 1.05
    };
  }

  /**
   * Getter para métricas de performance
   */
  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  /**
   * Getter para status da IA
   */
  getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      totalSignals: this.currentSignals.size,
      performance: this.performanceMetrics,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Inicia análise em tempo real
   */
  startRealtimeAnalysis(intervalSeconds = 10, symbols = ['R_10', 'R_25', 'R_50']) {
    if (this.realtimeAnalysis.isActive) {
      console.log('⚠️ Análise em tempo real já está ativa');
      return;
    }

    this.realtimeAnalysis.isActive = true;
    this.realtimeAnalysis.symbols = symbols;
    this.realtimeAnalysis.intervalSeconds = intervalSeconds;

    console.log(`🚀 Iniciando análise em tempo real (${intervalSeconds}s) para: ${symbols.join(', ')}`);

    this.realtimeAnalysis.interval = setInterval(async () => {
      await this.performRealtimeAnalysis();
    }, intervalSeconds * 1000);

    // Executar primeira análise imediatamente
    this.performRealtimeAnalysis();
  }

  /**
   * Para análise em tempo real
   */
  stopRealtimeAnalysis() {
    if (!this.realtimeAnalysis.isActive) {
      console.log('⚠️ Análise em tempo real não está ativa');
      return;
    }

    if (this.realtimeAnalysis.interval) {
      clearInterval(this.realtimeAnalysis.interval);
      this.realtimeAnalysis.interval = null;
    }

    this.realtimeAnalysis.isActive = false;
    console.log('🛑 Análise em tempo real parada');
  }

  /**
   * Executa análise em tempo real
   */
  async performRealtimeAnalysis() {
    try {
      this.realtimeAnalysis.analysisCount++;
      const timestamp = new Date().toISOString();
      
      console.log(`🔍 [${timestamp}] Análise técnica em tempo real #${this.realtimeAnalysis.analysisCount}`);

      const analysisResults = [];

      for (const symbol of this.realtimeAnalysis.symbols) {
        try {
          // Buscar dados históricos do mercado
          const marketData = await this.marketDataFetcher.getHistoricalData(symbol, '1m', 100);
          
          if (marketData && marketData.length >= 20) {
            // Realizar análise técnica completa
            const technicalAnalysis = await this.technicalAnalysis.performCompleteAnalysis(symbol, marketData);
            
            analysisResults.push({
              symbol,
              action: technicalAnalysis.recommendation,
              confidence: technicalAnalysis.confidence,
              riskLevel: technicalAnalysis.riskLevel,
              timestamp,
              indicators: {
                rsi: technicalAnalysis.indicators.rsi,
                macd: technicalAnalysis.indicators.macd,
                bollinger: technicalAnalysis.indicators.bollinger,
                mhi: technicalAnalysis.indicators.mhi,
                stochastic: technicalAnalysis.indicators.stochastic,
                williams: technicalAnalysis.indicators.williams
              }
            });

            // Log apenas sinais importantes (confiança > 60%)
            if (technicalAnalysis.confidence > 60) {
              console.log(`🎯 ${symbol}: ${technicalAnalysis.recommendation} (${technicalAnalysis.confidence}%) - Risco: ${technicalAnalysis.riskLevel}`);
              console.log(`📊 RSI: ${technicalAnalysis.indicators.rsi?.value?.toFixed(1) || 'N/A'} | MACD: ${technicalAnalysis.indicators.macd?.trend || 'N/A'} | MHI: ${technicalAnalysis.indicators.mhi?.value?.toFixed(2) || 'N/A'}`);
            }
          } else {
            console.log(`⚠️ Dados insuficientes para análise técnica de ${symbol}`);
          }

        } catch (error) {
          console.error(`❌ Erro na análise técnica de ${symbol}:`, error.message);
        }
      }

      // Atualizar estado da análise
      this.realtimeAnalysis.lastAnalysis = {
        timestamp,
        results: analysisResults,
        marketSentiment: this.calculateMarketSentiment(analysisResults),
        trend: this.calculateMarketTrend(analysisResults),
        type: 'technical_analysis'
      };

      // Notificar subscribers
      this.notifySubscribers(this.realtimeAnalysis.lastAnalysis);

    } catch (error) {
      console.error('❌ Erro na análise técnica em tempo real:', error);
    }
  }

  /**
   * Calcula sentimento geral do mercado
   */
  calculateMarketSentiment(analysisResults) {
    const buySignals = analysisResults.filter(r => r.action === 'BUY').length;
    const sellSignals = analysisResults.filter(r => r.action === 'SELL').length;
    const totalSignals = analysisResults.length;

    if (totalSignals === 0) return 'NEUTRAL';

    const buyRatio = buySignals / totalSignals;
    
    if (buyRatio > 0.6) return 'BULLISH';
    if (buyRatio < 0.4) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Calcula tendência geral do mercado
   */
  calculateMarketTrend(analysisResults) {
    const avgConfidence = analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length;
    
    if (avgConfidence > 0.7) return 'STRONG';
    if (avgConfidence > 0.5) return 'MODERATE';
    return 'WEAK';
  }

  /**
   * Adiciona subscriber para notificações em tempo real
   */
  subscribeToRealtimeAnalysis(callback) {
    this.realtimeAnalysis.subscribers.add(callback);
    console.log(`📡 Subscriber adicionado. Total: ${this.realtimeAnalysis.subscribers.size}`);
  }

  /**
   * Remove subscriber
   */
  unsubscribeFromRealtimeAnalysis(callback) {
    this.realtimeAnalysis.subscribers.delete(callback);
    console.log(`📡 Subscriber removido. Total: ${this.realtimeAnalysis.subscribers.size}`);
  }

  /**
   * Notifica todos os subscribers
   */
  notifySubscribers(analysisData) {
    this.realtimeAnalysis.subscribers.forEach(callback => {
      try {
        callback(analysisData);
      } catch (error) {
        console.error('❌ Erro ao notificar subscriber:', error);
      }
    });
  }

  /**
   * Obtém status da análise em tempo real
   */
  getRealtimeAnalysisStatus() {
    return {
      isActive: this.realtimeAnalysis.isActive,
      lastAnalysis: this.realtimeAnalysis.lastAnalysis,
      analysisCount: this.realtimeAnalysis.analysisCount,
      subscribers: this.realtimeAnalysis.subscribers.size,
      symbols: this.realtimeAnalysis.symbols || [],
      interval: this.realtimeAnalysis.intervalSeconds || 0
    };
  }
}

/**
 * Classe para gerenciamento de risco
 */
class RiskManager {
  constructor() {
    this.maxRiskPerTrade = 0.02; // 2% do capital por trade
    this.maxDailyRisk = 0.06; // 6% do capital por dia
    this.maxConsecutiveLosses = 3;
    this.currentDailyLosses = 0;
    this.consecutiveLosses = 0;
  }

  adjustSignal(signal) {
    const adjustedSignal = { ...signal };
    
    // Verificar limite de perdas consecutivas
    if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
      adjustedSignal.action = 'HOLD';
      adjustedSignal.reasoning.push('Limite de perdas consecutivas atingido');
      return adjustedSignal;
    }
    
    // Ajustar tamanho da posição baseado no risco
    adjustedSignal.positionSize = this.calculatePositionSize(signal);
    
    // Ajustar stop loss baseado na volatilidade
    adjustedSignal.stopLoss = this.adjustStopLoss(signal);
    
    return adjustedSignal;
  }

  calculatePositionSize(signal) {
    // Cálculo simplificado do tamanho da posição
    return 100; // Em produção, calcular baseado no risco
  }

  adjustStopLoss(signal) {
    // Ajuste do stop loss baseado na volatilidade
    return signal.stopLoss;
  }

  updateTradeResult(result) {
    if (result.profit < 0) {
      this.consecutiveLosses++;
      this.currentDailyLosses++;
    } else {
      this.consecutiveLosses = 0;
    }
  }
}

/**
 * Classe para engine de estratégias
 */
class StrategyEngine {
  constructor() {
    this.strategies = new Map();
    this.loadStrategies();
  }

  loadStrategies() {
    // Carregar estratégias predefinidas
    this.strategies.set('scalping', {
      name: 'Scalping',
      timeframe: '1m',
      riskPerTrade: 0.01,
      takeProfit: 0.005,
      stopLoss: 0.003
    });

    this.strategies.set('swing', {
      name: 'Swing Trading',
      timeframe: '1h',
      riskPerTrade: 0.03,
      takeProfit: 0.02,
      stopLoss: 0.015
    });

    this.strategies.set('trend', {
      name: 'Trend Following',
      timeframe: '4h',
      riskPerTrade: 0.04,
      takeProfit: 0.03,
      stopLoss: 0.02
    });
  }

  getStrategy(name) {
    return this.strategies.get(name);
  }

  getAllStrategies() {
    return Array.from(this.strategies.values());
  }
}

module.exports = AITrader;
