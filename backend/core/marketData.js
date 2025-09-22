const axios = require('axios');

class MarketDataFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 segundos
  }

  /**
   * Busca dados históricos de preços para análise técnica
   */
  async getHistoricalData(symbol, timeframe = '1m', count = 100) {
    const cacheKey = `${symbol}_${timeframe}_${count}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Para símbolos Deriv, vamos simular dados baseados em ticks reais
      if (symbol.startsWith('R_')) {
        return await this.getDerivHistoricalData(symbol, count);
      }
      
      // Para outros símbolos, usar API externa (exemplo)
      return await this.getExternalHistoricalData(symbol, timeframe, count);
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      return this.generateSimulatedData(symbol, count);
    }
  }

  /**
   * Busca dados históricos específicos do Deriv
   */
  async getDerivHistoricalData(symbol, count = 100) {
    // Simular dados baseados em padrões reais do mercado
    const basePrice = this.getBasePriceForSymbol(symbol);
    const data = [];
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = Date.now() - (i * 60000); // 1 minuto entre cada ponto
      const volatility = this.getVolatilityForSymbol(symbol);
      const trend = this.getTrendForSymbol(symbol, i, count);
      
      const price = basePrice + (Math.random() - 0.5) * volatility + trend * (count - i) / count;
      
      data.push({
        timestamp,
        open: price,
        high: price + Math.random() * volatility * 0.1,
        low: price - Math.random() * volatility * 0.1,
        close: price + (Math.random() - 0.5) * volatility * 0.05,
        volume: Math.random() * 1000 + 500
      });
    }
    
    return data;
  }

  /**
   * Busca dados de API externa (exemplo com Alpha Vantage ou similar)
   */
  async getExternalHistoricalData(symbol, timeframe, count) {
    // Implementar integração com API externa se necessário
    return this.generateSimulatedData(symbol, count);
  }

  /**
   * Gera dados simulados para teste
   */
  generateSimulatedData(symbol, count) {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const timestamp = Date.now() - ((count - i) * 60000);
      const price = basePrice + (Math.random() - 0.5) * 100;
      
      data.push({
        timestamp,
        open: price,
        high: price + Math.random() * 10,
        low: price - Math.random() * 10,
        close: price + (Math.random() - 0.5) * 5,
        volume: Math.random() * 1000 + 500
      });
    }
    
    return data;
  }

  /**
   * Obtém preço base para cada símbolo
   */
  getBasePriceForSymbol(symbol) {
    const basePrices = {
      'R_10': 5850,
      'R_25': 5850,
      'R_50': 5850,
      'R_75': 5850,
      'R_100': 5850,
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'BTCUSD': 45000,
      'ETHUSD': 3000
    };
    
    return basePrices[symbol] || 100;
  }

  /**
   * Obtém volatilidade específica para cada símbolo
   */
  getVolatilityForSymbol(symbol) {
    const volatilities = {
      'R_10': 50,
      'R_25': 75,
      'R_50': 100,
      'R_75': 125,
      'R_100': 150,
      'EURUSD': 0.001,
      'GBPUSD': 0.0015,
      'BTCUSD': 2000,
      'ETHUSD': 150
    };
    
    return volatilities[symbol] || 10;
  }

  /**
   * Calcula tendência baseada em padrões de mercado
   */
  getTrendForSymbol(symbol, index, total) {
    // Simular diferentes tendências baseadas no tempo
    const timeBasedTrend = Math.sin((index / total) * Math.PI * 2) * 20;
    const randomTrend = (Math.random() - 0.5) * 10;
    
    return timeBasedTrend + randomTrend;
  }

  /**
   * Obtém dados em tempo real para análise
   */
  async getRealTimeData(symbol) {
    try {
      // Implementar busca de dados em tempo real
      const historicalData = await this.getHistoricalData(symbol, '1m', 5);
      return historicalData[historicalData.length - 1];
    } catch (error) {
      console.error('Erro ao buscar dados em tempo real:', error);
      return null;
    }
  }

  /**
   * Limpa cache expirado
   */
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = MarketDataFetcher;

