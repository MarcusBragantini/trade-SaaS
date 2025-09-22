/**
 * Estratégias de Trading Pré-configuradas
 * MHI, MACD, Bollinger Bands, RSI, etc.
 */

class TradingStrategies {
  constructor() {
    this.strategies = {
      MHI: this.mhiStrategy,
      MACD: this.macdStrategy,
      BOLLINGER: this.bollingerStrategy,
      RSI: this.rsiStrategy,
      STOCHASTIC: this.stochasticStrategy,
      WILLIAMS: this.williamsStrategy,
      MOMENTUM: this.momentumStrategy,
      MEAN_REVERSION: this.meanReversionStrategy
    };
  }

  /**
   * Estratégia MHI (Martingale Hi-Lo)
   * Baseada em sequências de cores (vermelho/verde)
   */
  mhiStrategy(marketData, config = {}) {
    const {
      sequenceLength = 5,
      minConfidence = 0.7,
      maxConsecutiveLosses = 3
    } = config;

    // Simular dados de cores (vermelho = 0, verde = 1)
    const colors = TradingStrategies.generateColorSequence(marketData.length);
    
    // Verificar sequência recente
    const recentSequence = colors.slice(-sequenceLength);
    const lastColor = recentSequence[recentSequence.length - 1];
    
    // MHI: Se última cor foi vermelha, apostar em verde (e vice-versa)
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];
    
    if (lastColor === 0) { // Última foi vermelha
      action = 'BUY'; // Apostar em verde
      confidence = 0.8;
      reason.push('MHI: Última cor vermelha, apostando em verde');
    } else if (lastColor === 1) { // Última foi verde
      action = 'SELL'; // Apostar em vermelho
      confidence = 0.8;
      reason.push('MHI: Última cor verde, apostando em vermelho');
    }

    // Verificar sequência de perdas consecutivas
    if (this.consecutiveLosses >= maxConsecutiveLosses) {
      action = 'HOLD';
      confidence = 0.3;
      reason.push(`MHI: ${maxConsecutiveLosses} perdas consecutivas, pausando`);
    }

    return {
      action,
      confidence: Math.min(confidence, 0.95),
      reason: reason.join('. '),
      strategy: 'MHI',
      stopLoss: action === 'BUY' ? marketData.close * 0.995 : marketData.close * 1.005,
      takeProfit: action === 'BUY' ? marketData.close * 1.01 : marketData.close * 0.99,
      duration: '10t' // 10 ticks
    };
  }

  /**
   * Estratégia MACD (Moving Average Convergence Divergence)
   */
  macdStrategy(marketData, config = {}) {
    const {
      fastPeriod = 12,
      slowPeriod = 26,
      signalPeriod = 9,
      minConfidence = 0.6
    } = config;

    // Calcular MACD
    const prices = marketData.map(d => d.close);
    const macd = TradingStrategies.calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
    
    if (macd.length < 2) {
      return { action: 'HOLD', confidence: 0.5, reason: 'MACD: Dados insuficientes' };
    }

    const current = macd[macd.length - 1];
    const previous = macd[macd.length - 2];
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    // MACD cruzou acima da linha de sinal (sinal de compra)
    if (current.macdLine > current.signalLine && previous.macdLine <= previous.signalLine) {
      action = 'BUY';
      confidence = 0.75;
      reason.push('MACD: Cruzamento acima da linha de sinal (sinal de alta)');
    }
    // MACD cruzou abaixo da linha de sinal (sinal de venda)
    else if (current.macdLine < current.signalLine && previous.macdLine >= previous.signalLine) {
      action = 'SELL';
      confidence = 0.75;
      reason.push('MACD: Cruzamento abaixo da linha de sinal (sinal de baixa)');
    }
    // MACD acima de zero (tendência de alta)
    else if (current.macdLine > 0) {
      action = 'BUY';
      confidence = 0.6;
      reason.push('MACD: Linha MACD acima de zero (tendência de alta)');
    }
    // MACD abaixo de zero (tendência de baixa)
    else if (current.macdLine < 0) {
      action = 'SELL';
      confidence = 0.6;
      reason.push('MACD: Linha MACD abaixo de zero (tendência de baixa)');
    }

    return {
      action,
      confidence: Math.min(confidence, 0.9),
      reason: reason.join('. '),
      strategy: 'MACD',
      stopLoss: action === 'BUY' ? marketData.close * 0.996 : marketData.close * 1.004,
      takeProfit: action === 'BUY' ? marketData.close * 1.008 : marketData.close * 0.992,
      duration: '15t'
    };
  }

  /**
   * Estratégia Bollinger Bands
   */
  bollingerStrategy(marketData, config = {}) {
    const {
      period = 20,
      stdDev = 2,
      minConfidence = 0.65
    } = config;

    const prices = marketData.map(d => d.close);
    const bb = TradingStrategies.calculateBollingerBands(prices, period, stdDev);
    
    if (bb.length < 2) {
      return { action: 'HOLD', confidence: 0.5, reason: 'Bollinger: Dados insuficientes' };
    }

    const current = bb[bb.length - 1];
    const currentPrice = prices[prices.length - 1];
    const previous = bb[bb.length - 2];
    const previousPrice = prices[prices.length - 2];
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    // Preço tocou banda inferior (possível reversão para cima)
    if (currentPrice <= current.lower && previousPrice > previous.lower) {
      action = 'BUY';
      confidence = 0.8;
      reason.push('Bollinger: Preço tocou banda inferior (reversão de alta)');
    }
    // Preço tocou banda superior (possível reversão para baixo)
    else if (currentPrice >= current.upper && previousPrice < previous.upper) {
      action = 'SELL';
      confidence = 0.8;
      reason.push('Bollinger: Preço tocou banda superior (reversão de baixa)');
    }
    // Preço próximo da banda inferior
    else if (currentPrice < current.middle * 0.995) {
      action = 'BUY';
      confidence = 0.65;
      reason.push('Bollinger: Preço próximo da banda inferior');
    }
    // Preço próximo da banda superior
    else if (currentPrice > current.middle * 1.005) {
      action = 'SELL';
      confidence = 0.65;
      reason.push('Bollinger: Preço próximo da banda superior');
    }

    return {
      action,
      confidence: Math.min(confidence, 0.85),
      reason: reason.join('. '),
      strategy: 'BOLLINGER',
      stopLoss: action === 'BUY' ? current.lower * 0.99 : current.upper * 1.01,
      takeProfit: action === 'BUY' ? current.middle : current.middle,
      duration: '20t'
    };
  }

  /**
   * Estratégia RSI (Relative Strength Index)
   */
  rsiStrategy(marketData, config = {}) {
    const {
      period = 14,
      oversold = 30,
      overbought = 70,
      minConfidence = 0.7
    } = config;

    const prices = marketData.map(d => d.close);
    const rsi = TradingStrategies.calculateRSI(prices, period);
    
    if (rsi.length < 2) {
      return { action: 'HOLD', confidence: 0.5, reason: 'RSI: Dados insuficientes' };
    }

    const current = rsi[rsi.length - 1];
    const previous = rsi[rsi.length - 2];
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    // RSI saindo da zona de oversold (sinal de compra)
    if (current > oversold && previous <= oversold) {
      action = 'BUY';
      confidence = 0.8;
      reason.push(`RSI: Saindo da zona oversold (${oversold})`);
    }
    // RSI saindo da zona de overbought (sinal de venda)
    else if (current < overbought && previous >= overbought) {
      action = 'SELL';
      confidence = 0.8;
      reason.push(`RSI: Saindo da zona overbought (${overbought})`);
    }
    // RSI muito baixo (sobrevendido)
    else if (current < 25) {
      action = 'BUY';
      confidence = 0.75;
      reason.push('RSI: Muito sobrevendido (< 25)');
    }
    // RSI muito alto (sobrecomprado)
    else if (current > 75) {
      action = 'SELL';
      confidence = 0.75;
      reason.push('RSI: Muito sobrecomprado (> 75)');
    }

    return {
      action,
      confidence: Math.min(confidence, 0.9),
      reason: reason.join('. '),
      strategy: 'RSI',
      stopLoss: action === 'BUY' ? marketData.close * 0.995 : marketData.close * 1.005,
      takeProfit: action === 'BUY' ? marketData.close * 1.01 : marketData.close * 0.99,
      duration: '12t'
    };
  }

  /**
   * Estratégia Stochastic
   */
  stochasticStrategy(marketData, config = {}) {
    const {
      kPeriod = 14,
      dPeriod = 3,
      oversold = 20,
      overbought = 80
    } = config;

    const prices = marketData.map(d => d.close);
    const stochastic = TradingStrategies.calculateStochastic(prices, kPeriod, dPeriod);
    
    if (stochastic.length < 2) {
      return { action: 'HOLD', confidence: 0.5, reason: 'Stochastic: Dados insuficientes' };
    }

    const current = stochastic[stochastic.length - 1];
    const previous = stochastic[stochastic.length - 2];
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    // %K cruzou acima de %D na zona oversold
    if (current.k > current.d && previous.k <= previous.d && current.k < 30) {
      action = 'BUY';
      confidence = 0.8;
      reason.push('Stochastic: %K cruzou %D na zona oversold');
    }
    // %K cruzou abaixo de %D na zona overbought
    else if (current.k < current.d && previous.k >= previous.d && current.k > 70) {
      action = 'SELL';
      confidence = 0.8;
      reason.push('Stochastic: %K cruzou %D na zona overbought');
    }

    return {
      action,
      confidence: Math.min(confidence, 0.85),
      reason: reason.join('. '),
      strategy: 'STOCHASTIC',
      stopLoss: action === 'BUY' ? marketData.close * 0.996 : marketData.close * 1.004,
      takeProfit: action === 'BUY' ? marketData.close * 1.008 : marketData.close * 0.992,
      duration: '15t'
    };
  }

  /**
   * Estratégia Williams %R
   */
  williamsStrategy(marketData, config = {}) {
    const {
      period = 14,
      oversold = -80,
      overbought = -20
    } = config;

    const prices = marketData.map(d => d.close);
    const williams = TradingStrategies.calculateWilliams(prices, period);
    
    if (williams.length < 2) {
      return { action: 'HOLD', confidence: 0.5, reason: 'Williams: Dados insuficientes' };
    }

    const current = williams[williams.length - 1];
    const previous = williams[williams.length - 2];
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    // Williams saindo da zona oversold
    if (current > oversold && previous <= oversold) {
      action = 'BUY';
      confidence = 0.75;
      reason.push(`Williams: Saindo da zona oversold (${oversold})`);
    }
    // Williams saindo da zona overbought
    else if (current < overbought && previous >= overbought) {
      action = 'SELL';
      confidence = 0.75;
      reason.push(`Williams: Saindo da zona overbought (${overbought})`);
    }

    return {
      action,
      confidence: Math.min(confidence, 0.8),
      reason: reason.join('. '),
      strategy: 'WILLIAMS',
      stopLoss: action === 'BUY' ? marketData.close * 0.995 : marketData.close * 1.005,
      takeProfit: action === 'BUY' ? marketData.close * 1.01 : marketData.close * 0.99,
      duration: '18t'
    };
  }

  /**
   * Estratégia Momentum
   */
  momentumStrategy(marketData, config = {}) {
    const { period = 10 } = config;
    
    if (marketData.length < period + 1) {
      return { action: 'HOLD', confidence: 0.5, reason: 'Momentum: Dados insuficientes' };
    }

    const currentPrice = marketData[marketData.length - 1].close;
    const pastPrice = marketData[marketData.length - 1 - period].close;
    const momentum = ((currentPrice - pastPrice) / pastPrice) * 100;
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    if (momentum > 2) {
      action = 'BUY';
      confidence = 0.7;
      reason.push(`Momentum: Forte momentum positivo (${momentum.toFixed(2)}%)`);
    } else if (momentum < -2) {
      action = 'SELL';
      confidence = 0.7;
      reason.push(`Momentum: Forte momentum negativo (${momentum.toFixed(2)}%)`);
    }

    return {
      action,
      confidence: Math.min(confidence, 0.8),
      reason: reason.join('. '),
      strategy: 'MOMENTUM',
      stopLoss: action === 'BUY' ? marketData.close * 0.996 : marketData.close * 1.004,
      takeProfit: action === 'BUY' ? marketData.close * 1.008 : marketData.close * 0.992,
      duration: '12t'
    };
  }

  /**
   * Estratégia Mean Reversion
   */
  meanReversionStrategy(marketData, config = {}) {
    const { period = 20, threshold = 0.02 } = config;
    
    const prices = marketData.map(d => d.close);
    const sma = TradingStrategies.calculateSMA(prices, period);
    
    if (sma.length === 0) {
      return { action: 'HOLD', confidence: 0.5, reason: 'Mean Reversion: Dados insuficientes' };
    }

    const currentPrice = prices[prices.length - 1];
    const currentSMA = sma[sma.length - 1];
    const deviation = (currentPrice - currentSMA) / currentSMA;
    
    let action = 'HOLD';
    let confidence = 0.5;
    let reason = [];

    // Preço muito acima da média (reversão para baixo)
    if (deviation > threshold) {
      action = 'SELL';
      confidence = 0.75;
      reason.push(`Mean Reversion: Preço ${(deviation * 100).toFixed(2)}% acima da média`);
    }
    // Preço muito abaixo da média (reversão para cima)
    else if (deviation < -threshold) {
      action = 'BUY';
      confidence = 0.75;
      reason.push(`Mean Reversion: Preço ${(Math.abs(deviation) * 100).toFixed(2)}% abaixo da média`);
    }

    return {
      action,
      confidence: Math.min(confidence, 0.85),
      reason: reason.join('. '),
      strategy: 'MEAN_REVERSION',
      stopLoss: action === 'BUY' ? currentSMA * 0.995 : currentSMA * 1.005,
      takeProfit: currentSMA,
      duration: '25t'
    };
  }

  // Métodos auxiliares para cálculos técnicos
  static generateColorSequence(length) {
    // Simular sequência de cores para MHI
    const colors = [];
    for (let i = 0; i < length; i++) {
      colors.push(Math.random() > 0.5 ? 1 : 0); // 0 = vermelho, 1 = verde
    }
    return colors;
  }

  static calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod) {
    const emaFast = TradingStrategies.calculateEMA(prices, fastPeriod);
    const emaSlow = TradingStrategies.calculateEMA(prices, slowPeriod);
    const macdLine = [];
    
    for (let i = 0; i < emaFast.length; i++) {
      if (emaFast[i] && emaSlow[i]) {
        macdLine.push(emaFast[i] - emaSlow[i]);
      }
    }
    
    const signalLine = TradingStrategies.calculateEMA(macdLine, signalPeriod);
    const histogram = [];
    
    for (let i = 0; i < macdLine.length; i++) {
      if (signalLine[i]) {
        histogram.push(macdLine[i] - signalLine[i]);
      }
    }
    
    return macdLine.map((macd, i) => ({
      macdLine: macd,
      signalLine: signalLine[i] || 0,
      histogram: histogram[i] || 0
    }));
  }

  static calculateBollingerBands(prices, period, stdDev) {
    const sma = TradingStrategies.calculateSMA(prices, period);
    const bands = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (stdDev * standardDeviation),
        middle: mean,
        lower: mean - (stdDev * standardDeviation)
      });
    }
    
    return bands;
  }

  static calculateRSI(prices, period) {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGains = TradingStrategies.calculateSMA(gains, period);
    const avgLosses = TradingStrategies.calculateSMA(losses, period);
    const rsi = [];
    
    for (let i = 0; i < avgGains.length; i++) {
      if (avgLosses[i] === 0) {
        rsi.push(100);
      } else {
        const rs = avgGains[i] / avgLosses[i];
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  }

  static calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const average = slice.reduce((sum, price) => sum + price, 0) / period;
      sma.push(average);
    }
    return sma;
  }

  static calculateEMA(prices, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // Primeiro valor é SMA
    if (prices.length >= period) {
      const sma = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
      ema.push(sma);
      
      for (let i = period; i < prices.length; i++) {
        const value = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
        ema.push(value);
      }
    }
    
    return ema;
  }

  static calculateStochastic(prices, kPeriod, dPeriod) {
    const stochastic = [];
    
    for (let i = kPeriod - 1; i < prices.length; i++) {
      const slice = prices.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice);
      const lowest = Math.min(...slice);
      const current = prices[i];
      
      const k = ((current - lowest) / (highest - lowest)) * 100;
      stochastic.push({ k });
    }
    
    // Calcular %D (média móvel de %K)
    for (let i = dPeriod - 1; i < stochastic.length; i++) {
      const slice = stochastic.slice(i - dPeriod + 1, i + 1);
      const d = slice.reduce((sum, item) => sum + item.k, 0) / dPeriod;
      stochastic[i].d = d;
    }
    
    return stochastic.filter(item => item.d !== undefined);
  }

  static calculateWilliams(prices, period) {
    const williams = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const highest = Math.max(...slice);
      const lowest = Math.min(...slice);
      const current = prices[i];
      
      const wr = ((highest - current) / (highest - lowest)) * -100;
      williams.push(wr);
    }
    
    return williams;
  }

  /**
   * Executar análise com múltiplas estratégias
   */
  analyzeWithStrategies(marketData, selectedStrategies = ['MHI', 'MACD', 'RSI']) {
    const results = [];
    
    selectedStrategies.forEach(strategyName => {
      if (this.strategies[strategyName]) {
        const result = this.strategies[strategyName](marketData);
        results.push(result);
      }
    });
    
    // Combinar resultados
    return this.combineStrategyResults(results);
  }

  /**
   * Combinar resultados de múltiplas estratégias
   */
  combineStrategyResults(results) {
    if (results.length === 0) {
      return { action: 'HOLD', confidence: 0.5, reason: 'Nenhuma estratégia válida' };
    }
    
    const buySignals = results.filter(r => r.action === 'BUY');
    const sellSignals = results.filter(r => r.action === 'SELL');
    const holdSignals = results.filter(r => r.action === 'HOLD');
    
    let finalAction = 'HOLD';
    let confidence = 0.5;
    let reasons = [];
    
    if (buySignals.length > sellSignals.length) {
      finalAction = 'BUY';
      confidence = buySignals.reduce((sum, r) => sum + r.confidence, 0) / buySignals.length;
      reasons = buySignals.map(r => `${r.strategy}: ${r.reason}`);
    } else if (sellSignals.length > buySignals.length) {
      finalAction = 'SELL';
      confidence = sellSignals.reduce((sum, r) => sum + r.confidence, 0) / sellSignals.length;
      reasons = sellSignals.map(r => `${r.strategy}: ${r.reason}`);
    }
    
    return {
      action: finalAction,
      confidence: Math.min(confidence, 0.95),
      reason: reasons.join(' | '),
      strategies: results.map(r => ({
        name: r.strategy,
        action: r.action,
        confidence: r.confidence,
        reason: r.reason
      }))
    };
  }
}

module.exports = TradingStrategies;
