class TechnicalAnalysis {
  constructor() {
    this.indicators = {
      rsi: this.calculateRSI,
      macd: this.calculateMACD,
      bollinger: this.calculateBollingerBands,
      mhi: this.calculateMHI,
      stochastic: this.calculateStochastic,
      williams: this.calculateWilliamsR,
      ema: this.calculateEMA,
      sma: this.calculateSMA
    };
  }

  /**
   * Análise técnica completa com múltiplos indicadores
   */
  async performCompleteAnalysis(symbol, marketData) {
    try {
      const prices = marketData.map(d => d.close);
      const highs = marketData.map(d => d.high);
      const lows = marketData.map(d => d.low);
      const volumes = marketData.map(d => d.volume);

      const analysis = {
        symbol,
        timestamp: Date.now(),
        price: prices[prices.length - 1],
        indicators: {},
        signals: {},
        recommendation: 'HOLD',
        confidence: 0,
        riskLevel: 'MEDIUM'
      };

      // Calcular todos os indicadores
      analysis.indicators.rsi = this.calculateRSI(prices, 14);
      analysis.indicators.macd = this.calculateMACD(prices, 12, 26, 9);
      analysis.indicators.bollinger = this.calculateBollingerBands(prices, 20, 2);
      analysis.indicators.mhi = this.calculateMHI(prices, 5);
      analysis.indicators.stochastic = this.calculateStochastic(highs, lows, prices, 14, 3);
      analysis.indicators.williams = this.calculateWilliamsR(highs, lows, prices, 14);
      analysis.indicators.ema12 = this.calculateEMA(prices, 12);
      analysis.indicators.ema26 = this.calculateEMA(prices, 26);
      analysis.indicators.sma20 = this.calculateSMA(prices, 20);
      analysis.indicators.sma50 = this.calculateSMA(prices, 50);

      // Gerar sinais baseados nos indicadores
      analysis.signals = this.generateSignals(analysis.indicators, prices);

      // Determinar recomendação final
      const recommendation = this.determineRecommendation(analysis.signals, analysis.indicators);
      analysis.recommendation = recommendation.action;
      analysis.confidence = recommendation.confidence;
      analysis.riskLevel = this.assessRisk(analysis.indicators, analysis.signals);

      return analysis;
    } catch (error) {
      console.error('Erro na análise técnica:', error);
      return this.getDefaultAnalysis(symbol);
    }
  }

  /**
   * Calcula RSI (Relative Strength Index)
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return { value: 50, signal: 'NEUTRAL' };

    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return { value: 100, signal: 'STRONG_BUY' };

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let signal = 'NEUTRAL';
    if (rsi > 70) signal = 'SELL';
    else if (rsi < 30) signal = 'BUY';
    else if (rsi > 60) signal = 'WEAK_SELL';
    else if (rsi < 40) signal = 'WEAK_BUY';

    return { value: rsi, signal };
  }

  /**
   * Calcula MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0, trend: 'NEUTRAL' };

    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    const macd = emaFast - emaSlow;

    // Calcular linha de sinal (EMA do MACD)
    const macdValues = [];
    for (let i = slowPeriod; i < prices.length; i++) {
      const fastEMA = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
      const slowEMA = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
      macdValues.push(fastEMA - slowEMA);
    }

    const signal = macdValues.length >= signalPeriod ? 
      this.calculateEMA(macdValues, signalPeriod) : 0;
    const histogram = macd - signal;

    let trend = 'NEUTRAL';
    if (macd > signal && histogram > 0) trend = 'BULLISH';
    else if (macd < signal && histogram < 0) trend = 'BEARISH';

    return { macd, signal, histogram, trend };
  }

  /**
   * Calcula Bollinger Bands
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0, position: 'MIDDLE' };

    const sma = this.calculateSMA(prices, period);
    const recentPrices = prices.slice(-period);
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upper = sma + (stdDev * standardDeviation);
    const lower = sma - (stdDev * standardDeviation);
    const currentPrice = prices[prices.length - 1];

    let position = 'MIDDLE';
    if (currentPrice > upper) position = 'ABOVE_UPPER';
    else if (currentPrice < lower) position = 'BELOW_LOWER';
    else if (currentPrice > sma) position = 'UPPER_HALF';
    else position = 'LOWER_HALF';

    return { upper, middle: sma, lower, position };
  }

  /**
   * Calcula MHI (Market Heat Index) - Estratégia personalizada
   */
  calculateMHI(prices, period = 5) {
    if (prices.length < period) return { value: 0, signal: 'NEUTRAL' };

    const recentPrices = prices.slice(-period);
    const currentPrice = recentPrices[recentPrices.length - 1];
    const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / period;

    // Calcular volatilidade
    const volatility = recentPrices.reduce((sum, price) => sum + Math.abs(price - avgPrice), 0) / period;
    
    // Calcular momentum
    const momentum = (currentPrice - recentPrices[0]) / recentPrices[0] * 100;

    // MHI combina volatilidade e momentum
    const mhi = (momentum * 0.7) + (volatility * 0.3);

    let signal = 'NEUTRAL';
    if (mhi > 2) signal = 'STRONG_BUY';
    else if (mhi > 0.5) signal = 'BUY';
    else if (mhi < -2) signal = 'STRONG_SELL';
    else if (mhi < -0.5) signal = 'SELL';

    return { value: mhi, signal, momentum, volatility };
  }

  /**
   * Calcula Stochastic Oscillator
   */
  calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    if (closes.length < kPeriod) return { k: 50, d: 50, signal: 'NEUTRAL' };

    const recentHighs = highs.slice(-kPeriod);
    const recentLows = lows.slice(-kPeriod);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // Calcular %D (média móvel do %K)
    const kValues = [];
    for (let i = kPeriod; i <= closes.length; i++) {
      const periodHighs = highs.slice(i - kPeriod, i);
      const periodLows = lows.slice(i - kPeriod, i);
      const periodClose = closes[i - 1];
      
      const hh = Math.max(...periodHighs);
      const ll = Math.min(...periodLows);
      kValues.push(((periodClose - ll) / (hh - ll)) * 100);
    }

    const d = kValues.length >= dPeriod ? 
      kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod : k;

    let signal = 'NEUTRAL';
    if (k > 80 && d > 80) signal = 'SELL';
    else if (k < 20 && d < 20) signal = 'BUY';
    else if (k > d) signal = 'WEAK_BUY';
    else if (k < d) signal = 'WEAK_SELL';

    return { k, d, signal };
  }

  /**
   * Calcula Williams %R
   */
  calculateWilliamsR(highs, lows, closes, period = 14) {
    if (closes.length < period) return { value: -50, signal: 'NEUTRAL' };

    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;

    let signal = 'NEUTRAL';
    if (williamsR > -20) signal = 'SELL';
    else if (williamsR < -80) signal = 'BUY';
    else if (williamsR > -50) signal = 'WEAK_SELL';
    else if (williamsR < -50) signal = 'WEAK_BUY';

    return { value: williamsR, signal };
  }

  /**
   * Calcula EMA (Exponential Moving Average)
   */
  calculateEMA(prices, period) {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Calcula SMA (Simple Moving Average)
   */
  calculateSMA(prices, period) {
    if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
    
    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Gera sinais baseados nos indicadores
   */
  generateSignals(indicators, prices) {
    const signals = {
      rsi: indicators.rsi.signal,
      macd: indicators.macd.trend,
      bollinger: this.getBollingerSignal(indicators.bollinger),
      mhi: indicators.mhi.signal,
      stochastic: indicators.stochastic.signal,
      williams: indicators.williams.signal,
      trend: this.getTrendSignal(indicators.ema12, indicators.ema26, indicators.sma20, indicators.sma50)
    };

    return signals;
  }

  /**
   * Determina sinal das Bollinger Bands
   */
  getBollingerSignal(bollinger) {
    switch (bollinger.position) {
      case 'ABOVE_UPPER': return 'SELL';
      case 'BELOW_LOWER': return 'BUY';
      case 'UPPER_HALF': return 'WEAK_SELL';
      case 'LOWER_HALF': return 'WEAK_BUY';
      default: return 'NEUTRAL';
    }
  }

  /**
   * Determina sinal de tendência
   */
  getTrendSignal(ema12, ema26, sma20, sma50) {
    if (ema12 > ema26 && sma20 > sma50) return 'STRONG_BUY';
    if (ema12 < ema26 && sma20 < sma50) return 'STRONG_SELL';
    if (ema12 > ema26) return 'BUY';
    if (ema12 < ema26) return 'SELL';
    return 'NEUTRAL';
  }

  /**
   * Determina recomendação final
   */
  determineRecommendation(signals, indicators) {
    const signalWeights = {
      'STRONG_BUY': 3,
      'BUY': 2,
      'WEAK_BUY': 1,
      'NEUTRAL': 0,
      'WEAK_SELL': -1,
      'SELL': -2,
      'STRONG_SELL': -3,
      'BULLISH': 2,
      'BEARISH': -2
    };

    let totalScore = 0;
    let signalCount = 0;

    // Pesos para cada indicador
    const weights = {
      rsi: 0.2,
      macd: 0.2,
      bollinger: 0.15,
      mhi: 0.2,
      stochastic: 0.1,
      williams: 0.1,
      trend: 0.05
    };

    for (const [indicator, signal] of Object.entries(signals)) {
      const weight = weights[indicator] || 0.1;
      const score = signalWeights[signal] || 0;
      totalScore += score * weight;
      signalCount++;
    }

    // Determinar ação e confiança
    let action = 'HOLD';
    let confidence = 0;

    if (totalScore > 1.5) {
      action = 'BUY';
      confidence = Math.min(95, Math.abs(totalScore) * 20);
    } else if (totalScore < -1.5) {
      action = 'SELL';
      confidence = Math.min(95, Math.abs(totalScore) * 20);
    } else if (totalScore > 0.5) {
      action = 'WEAK_BUY';
      confidence = Math.min(70, Math.abs(totalScore) * 15);
    } else if (totalScore < -0.5) {
      action = 'WEAK_SELL';
      confidence = Math.min(70, Math.abs(totalScore) * 15);
    } else {
      confidence = Math.max(10, 50 - Math.abs(totalScore) * 10);
    }

    return { action, confidence: Math.round(confidence) };
  }

  /**
   * Avalia nível de risco
   */
  assessRisk(indicators, signals) {
    let riskScore = 0;

    // RSI extremo = alto risco
    if (indicators.rsi.value > 80 || indicators.rsi.value < 20) riskScore += 2;

    // Bollinger Bands extremo = alto risco
    if (indicators.bollinger.position === 'ABOVE_UPPER' || 
        indicators.bollinger.position === 'BELOW_LOWER') riskScore += 2;

    // Volatilidade alta = alto risco
    if (indicators.mhi.volatility > 50) riskScore += 1;

    // Sinais conflitantes = alto risco
    const buySignals = Object.values(signals).filter(s => s.includes('BUY')).length;
    const sellSignals = Object.values(signals).filter(s => s.includes('SELL')).length;
    if (buySignals > 0 && sellSignals > 0) riskScore += 1;

    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Análise padrão quando há erro
   */
  getDefaultAnalysis(symbol) {
    return {
      symbol,
      timestamp: Date.now(),
      price: 0,
      indicators: {},
      signals: {},
      recommendation: 'HOLD',
      confidence: 10,
      riskLevel: 'HIGH',
      error: 'Dados insuficientes para análise'
    };
  }
}

module.exports = TechnicalAnalysis;

