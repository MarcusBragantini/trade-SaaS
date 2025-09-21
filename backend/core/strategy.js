class StrategyEngine {
    constructor() {
        this.strategies = {
            'trend_following': this.trendFollowingStrategy,
            'mean_reversion': this.meanReversionStrategy,
            'breakout': this.breakoutStrategy,
            'random': this.randomStrategy
        };
        this.currentStrategy = 'trend_following';
        this.lastPrices = [];
        this.maxHistory = 20;
    }

    // Estratégia de seguimento de tendência
    trendFollowingStrategy(prices) {
        if (prices.length < 5) return 'call'; // Default se não há dados suficientes

        const recent = prices.slice(-5);
        const trend = this.calculateTrend(recent);
        
        if (trend > 0.02) return 'call'; // Tendência de alta
        if (trend < -0.02) return 'put'; // Tendência de baixa
        
        return Math.random() > 0.5 ? 'call' : 'put'; // Neutro
    }

    // Estratégia de reversão à média
    meanReversionStrategy(prices) {
        if (prices.length < 10) return 'call';

        const recent = prices.slice(-10);
        const average = recent.reduce((a, b) => a + b, 0) / recent.length;
        const current = recent[recent.length - 1];
        
        // Se preço está muito acima da média, apostar na queda
        if (current > average * 1.01) return 'put';
        // Se preço está muito abaixo da média, apostar na subida
        if (current < average * 0.99) return 'call';
        
        return Math.random() > 0.5 ? 'call' : 'put';
    }

    // Estratégia de breakout
    breakoutStrategy(prices) {
        if (prices.length < 15) return 'call';

        const recent = prices.slice(-15);
        const high = Math.max(...recent);
        const low = Math.min(...recent);
        const current = recent[recent.length - 1];
        
        // Se preço está próximo do máximo, apostar na continuação
        if (current > high * 0.98) return 'call';
        // Se preço está próximo do mínimo, apostar na reversão
        if (current < low * 1.02) return 'put';
        
        return Math.random() > 0.5 ? 'call' : 'put';
    }

    // Estratégia aleatória (para testes)
    randomStrategy(prices) {
        return Math.random() > 0.5 ? 'call' : 'put';
    }

    // Calcular tendência
    calculateTrend(prices) {
        if (prices.length < 2) return 0;
        
        const first = prices[0];
        const last = prices[prices.length - 1];
        return (last - first) / first;
    }

    // Decidir direção baseada na estratégia atual
    decidir(prices) {
        // Adicionar preços ao histórico
        if (prices) {
            this.lastPrices.push(prices);
            if (this.lastPrices.length > this.maxHistory) {
                this.lastPrices.shift();
            }
        }

        // Usar preços do histórico se não foram fornecidos
        const pricesToUse = prices || this.lastPrices;
        
        if (pricesToUse.length === 0) {
            console.log('⚠️ Sem dados de preço, usando estratégia aleatória');
            return this.randomStrategy([]);
        }

        const strategy = this.strategies[this.currentStrategy];
        const decision = strategy(pricesToUse);
        
        console.log(`🎯 Estratégia ${this.currentStrategy}: ${decision.toUpperCase()}`);
        console.log(`📊 Preços analisados: ${pricesToUse.length} pontos`);
        
        return decision;
    }

    // Alterar estratégia
    setStrategy(strategyName) {
        if (this.strategies[strategyName]) {
            this.currentStrategy = strategyName;
            console.log(`🔄 Estratégia alterada para: ${strategyName}`);
        } else {
            console.log(`❌ Estratégia não encontrada: ${strategyName}`);
        }
    }

    // Obter estratégias disponíveis
    getAvailableStrategies() {
        return Object.keys(this.strategies);
    }

    // Obter estatísticas da estratégia
    getStrategyStats() {
        return {
            current: this.currentStrategy,
            available: this.getAvailableStrategies(),
            historyLength: this.lastPrices.length,
            lastTrend: this.lastPrices.length > 1 ? 
                this.calculateTrend(this.lastPrices.slice(-5)) : 0
        };
    }
}

module.exports = StrategyEngine;
