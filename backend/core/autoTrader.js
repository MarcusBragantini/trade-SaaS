const WebSocket = require('ws');
const RiskManager = require('./riskManager');
const StrategyEngine = require('./strategy');

class AutoTrader {
    constructor(userId, derivToken) {
        this.userId = userId;
        this.derivToken = derivToken;
        this.riskManager = new RiskManager();
        this.strategy = new StrategyEngine();
        this.ws = null;
        this.isConnected = false;
        this.isTrading = false;
        this.currentSymbol = 'BTCUSD';
        this.stake = 10;
        this.duration = 5;
        this.durationUnit = 'm';
        this.lastPrice = null;
        this.priceHistory = [];
        this.maxHistory = 50;
    }

    // Conectar ao WebSocket da Deriv
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');
                
                this.ws.on('open', () => {
                    console.log('🔌 Conectado ao WebSocket da Deriv');
                    this.isConnected = true;
                    this.authenticate();
                    resolve();
                });

                this.ws.on('message', (data) => {
                    this.handleMessage(JSON.parse(data));
                });

                this.ws.on('error', (error) => {
                    console.error('❌ Erro WebSocket:', error);
                    this.isConnected = false;
                    reject(error);
                });

                this.ws.on('close', () => {
                    console.log('🔌 Conexão WebSocket fechada');
                    this.isConnected = false;
                });

            } catch (error) {
                console.error('❌ Erro ao conectar:', error);
                reject(error);
            }
        });
    }

    // Autenticar
    authenticate() {
        if (!this.ws || !this.isConnected) return;

        console.log('🔑 Autenticando...');
        this.ws.send(JSON.stringify({
            authorize: this.derivToken
        }));
    }

    // Iniciar trading automático
    startTrading(symbol = 'BTCUSD', stake = 10, duration = 5, durationUnit = 'm') {
        if (!this.isConnected) {
            console.log('❌ Não conectado ao WebSocket');
            return false;
        }

        this.currentSymbol = symbol;
        this.stake = stake;
        this.duration = duration;
        this.durationUnit = durationUnit;
        this.isTrading = true;

        console.log(`🚀 Iniciando trading automático:`);
        console.log(`   Símbolo: ${symbol}`);
        console.log(`   Stake: $${stake}`);
        console.log(`   Duração: ${duration}${durationUnit}`);

        // Solicitar ticks do símbolo
        this.ws.send(JSON.stringify({
            ticks: symbol
        }));

        return true;
    }

    // Parar trading automático
    stopTrading() {
        this.isTrading = false;
        console.log('⏹️ Trading automático parado');
    }

    // Processar mensagens do WebSocket
    handleMessage(data) {
        if (data.msg_type === 'authorize') {
            console.log('✅ Autenticado com sucesso!');
            if (this.isTrading) {
                this.ws.send(JSON.stringify({ ticks: this.currentSymbol }));
            }
        }

        if (data.msg_type === 'tick' && this.isTrading) {
            this.handleTick(data.tick);
        }

        if (data.msg_type === 'proposal' && this.isTrading) {
            this.handleProposal(data.proposal);
        }

        if (data.msg_type === 'buy' && this.isTrading) {
            this.handleBuyResponse(data.buy);
        }

        if (data.error) {
            console.error('❌ Erro API:', data.error.message, 'Código:', data.error.code);
        }
    }

    // Processar tick de preço
    handleTick(tick) {
        const price = parseFloat(tick.quote);
        this.lastPrice = price;
        
        // Adicionar ao histórico
        this.priceHistory.push(price);
        if (this.priceHistory.length > this.maxHistory) {
            this.priceHistory.shift();
        }

        console.log(`📊 Tick ${this.currentSymbol}: $${price.toFixed(4)}`);

        // Verificar se pode fazer trade
        if (!this.riskManager.canTrade(this.stake)) {
            console.log('🚫 Trade bloqueado pelo gerenciador de risco');
            return;
        }

        // Decidir direção usando estratégia
        const direction = this.strategy.decidir(this.priceHistory);
        
        // Solicitar proposta
        this.ws.send(JSON.stringify({
            proposal: 1,
            amount: this.stake,
            basis: 'stake',
            contract_type: direction,
            currency: 'USD',
            duration: this.duration,
            duration_unit: this.durationUnit,
            symbol: this.currentSymbol
        }));
    }

    // Processar proposta
    handleProposal(proposal) {
        console.log('💰 Proposta recebida:', JSON.stringify(proposal, null, 2));
        
        if (proposal && proposal.ask_price && proposal.id) {
            // Executar compra
            this.ws.send(JSON.stringify({
                buy: proposal.id,
                price: proposal.ask_price
            }));
        } else {
            console.log('⚠️ Proposta inválida ou incompleta');
        }
    }

    // Processar resposta de compra
    handleBuyResponse(buy) {
        console.log(`🎯 Ordem executada! Contrato: ${buy.contract_id}`);
        
        // Simular resultado após duração (em produção, usar WebSocket para resultado real)
        setTimeout(() => {
            this.simulateTradeResult(buy.contract_id);
        }, this.duration * (this.durationUnit === 'm' ? 60000 : 1000));
    }

    // Simular resultado do trade (para demonstração)
    simulateTradeResult(contractId) {
        const profit = Math.random() > 0.5 ? this.stake * 0.8 : -this.stake;
        
        console.log(`📈 Trade ${contractId} finalizado: $${profit.toFixed(2)}`);
        
        // Registrar no gerenciador de risco
        this.riskManager.recordTrade(this.stake, profit);
        
        // Log estatísticas
        const stats = this.riskManager.getStats();
        console.log(`📊 Estatísticas: ${stats.trades} trades, ${stats.winRate}% win rate`);
    }

    // Configurar parâmetros
    configure(symbol, stake, duration, durationUnit, strategy) {
        this.currentSymbol = symbol;
        this.stake = stake;
        this.duration = duration;
        this.durationUnit = durationUnit;
        
        if (strategy) {
            this.strategy.setStrategy(strategy);
        }

        console.log('⚙️ Configuração atualizada:', {
            symbol,
            stake,
            duration,
            durationUnit,
            strategy: this.strategy.currentStrategy
        });
    }

    // Obter status
    getStatus() {
        return {
            isConnected: this.isConnected,
            isTrading: this.isTrading,
            currentSymbol: this.currentSymbol,
            stake: this.stake,
            duration: this.duration,
            durationUnit: this.durationUnit,
            lastPrice: this.lastPrice,
            riskStats: this.riskManager.getStats(),
            strategyStats: this.strategy.getStrategyStats()
        };
    }

    // Desconectar
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.isTrading = false;
        console.log('🔌 Desconectado do WebSocket');
    }
}

module.exports = AutoTrader;
