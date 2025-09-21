class RiskManager {
    constructor() {
        this.maxDailyLoss = 100; // Máximo de perda diária em USD
        this.maxConsecutiveLosses = 3; // Máximo de perdas consecutivas
        this.maxTradesPerDay = 50; // Máximo de trades por dia
        this.dailyStats = {
            trades: 0,
            losses: 0,
            consecutiveLosses: 0,
            totalLoss: 0,
            lastReset: new Date().toDateString()
        };
        this.isTradingAllowed = true;
    }

    // Verificar se pode fazer trade
    canTrade(amount) {
        this.resetDailyStatsIfNeeded();
        
        // Verificar se trading está permitido
        if (!this.isTradingAllowed) {
            console.log('🚫 Trading bloqueado pelo gerenciador de risco');
            return false;
        }

        // Verificar limite de trades por dia
        if (this.dailyStats.trades >= this.maxTradesPerDay) {
            console.log('🚫 Limite de trades diários atingido');
            return false;
        }

        // Verificar perda diária máxima
        if (this.dailyStats.totalLoss >= this.maxDailyLoss) {
            console.log('🚫 Perda diária máxima atingida');
            this.isTradingAllowed = false;
            return false;
        }

        // Verificar perdas consecutivas
        if (this.dailyStats.consecutiveLosses >= this.maxConsecutiveLosses) {
            console.log('🚫 Muitas perdas consecutivas, pausando trading');
            this.isTradingAllowed = false;
            return false;
        }

        return true;
    }

    // Registrar resultado do trade
    recordTrade(amount, profit) {
        this.resetDailyStatsIfNeeded();
        
        this.dailyStats.trades++;
        
        if (profit < 0) {
            this.dailyStats.losses++;
            this.dailyStats.consecutiveLosses++;
            this.dailyStats.totalLoss += Math.abs(profit);
            
            console.log(`📉 Trade com perda: $${Math.abs(profit).toFixed(2)}`);
            console.log(`📊 Perdas consecutivas: ${this.dailyStats.consecutiveLosses}`);
            console.log(`📊 Perda total hoje: $${this.dailyStats.totalLoss.toFixed(2)}`);
        } else {
            this.dailyStats.consecutiveLosses = 0; // Reset perdas consecutivas
            console.log(`📈 Trade com lucro: $${profit.toFixed(2)}`);
        }

        // Verificar se deve pausar trading
        if (this.dailyStats.consecutiveLosses >= this.maxConsecutiveLosses) {
            console.log('⏸️ Pausando trading devido a perdas consecutivas');
            this.isTradingAllowed = false;
        }

        if (this.dailyStats.totalLoss >= this.maxDailyLoss) {
            console.log('⏸️ Pausando trading devido a perda diária máxima');
            this.isTradingAllowed = false;
        }
    }

    // Resetar estatísticas diárias se necessário
    resetDailyStatsIfNeeded() {
        const today = new Date().toDateString();
        if (this.dailyStats.lastReset !== today) {
            console.log('🔄 Resetando estatísticas diárias');
            this.dailyStats = {
                trades: 0,
                losses: 0,
                consecutiveLosses: 0,
                totalLoss: 0,
                lastReset: today
            };
            this.isTradingAllowed = true; // Reativar trading no novo dia
        }
    }

    // Reativar trading manualmente
    reactivateTrading() {
        this.isTradingAllowed = true;
        console.log('✅ Trading reativado manualmente');
    }

    // Obter estatísticas
    getStats() {
        this.resetDailyStatsIfNeeded();
        return {
            ...this.dailyStats,
            isTradingAllowed: this.isTradingAllowed,
            winRate: this.dailyStats.trades > 0 ? 
                ((this.dailyStats.trades - this.dailyStats.losses) / this.dailyStats.trades * 100).toFixed(1) : 0
        };
    }

    // Configurar limites
    setLimits(maxDailyLoss, maxConsecutiveLosses, maxTradesPerDay) {
        this.maxDailyLoss = maxDailyLoss;
        this.maxConsecutiveLosses = maxConsecutiveLosses;
        this.maxTradesPerDay = maxTradesPerDay;
        console.log('⚙️ Limites de risco atualizados:', {
            maxDailyLoss,
            maxConsecutiveLosses,
            maxTradesPerDay
        });
    }
}

module.exports = RiskManager;
