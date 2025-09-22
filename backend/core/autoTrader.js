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
        this.isRunning = false;
        this.currentSymbol = 'BTCUSD';
        this.stake = 10;
        this.duration = 5;
        this.durationUnit = 'm';
        this.lastPrice = null;
        this.priceHistory = [];
        this.maxHistory = 50;
        
        // Configurações da IA
        this.useAI = false;
        this.aiTrader = null;
        this.aiConfidence = 0.7;
        this.aiAnalysisInterval = 60000; // 1 minuto
        this.aiAnalysisTimer = null;
        this.lastAISignal = null;
        
        // Métricas
        this.tradesToday = 0;
        this.maxTradesPerDay = 10;
        this.totalProfit = 0;
        this.winningTrades = 0;
        this.losingTrades = 0;
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
        if (!tick || !tick.quote) {
            console.log('⚠️ Tick inválido recebido:', tick);
            return;
        }
        
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
        this.isRunning = false;
        
        // Parar análise da IA
        if (this.aiAnalysisTimer) {
            clearInterval(this.aiAnalysisTimer);
            this.aiAnalysisTimer = null;
        }
        
        console.log('🔌 Desconectado do WebSocket');
    }

    // Iniciar auto-trading
    async start(config = {}) {
        try {
            console.log(`🚀 Iniciando auto-trading para usuário ${this.userId}`);
            
            // Configurar parâmetros
            this.useAI = config.useAI || false;
            this.aiTrader = config.aiTrader || null;
            this.aiConfidence = config.aiConfidence || 0.7;
            this.maxTradesPerDay = config.maxTradesPerDay || 10;
            this.currentSymbol = config.symbols?.[0] || 'BTCUSD';
            
            if (this.useAI && this.aiTrader) {
                console.log('🤖 Modo IA ativado');
                this.startAIAnalysis();
            }
            
            // Conectar ao WebSocket
            await this.connect();
            
            // Iniciar trading
            this.isRunning = true;
            this.isTrading = true;
            
            console.log(`✅ Auto-trading iniciado com sucesso`);
            
        } catch (error) {
            console.error('❌ Erro ao iniciar auto-trading:', error);
            throw error;
        }
    }

    // Parar auto-trading
    async stop() {
        try {
            console.log(`⏹️ Parando auto-trading para usuário ${this.userId}`);
            
            this.isRunning = false;
            this.isTrading = false;
            
            // Parar análise da IA
            if (this.aiAnalysisTimer) {
                clearInterval(this.aiAnalysisTimer);
                this.aiAnalysisTimer = null;
            }
            
            // Desconectar WebSocket
            this.disconnect();
            
            console.log(`✅ Auto-trading parado com sucesso`);
            
        } catch (error) {
            console.error('❌ Erro ao parar auto-trading:', error);
            throw error;
        }
    }

    // Iniciar análise da IA
    startAIAnalysis() {
        if (!this.useAI || !this.aiTrader) return;
        
        console.log('🤖 Iniciando análise contínua da IA');
        
        this.aiAnalysisTimer = setInterval(async () => {
            try {
                if (!this.isRunning || !this.isTrading) return;
                
                // Verificar limite de trades diários
                if (this.tradesToday >= this.maxTradesPerDay) {
                    console.log('📊 Limite de trades diários atingido');
                    return;
                }
                
                // Analisar mercado com IA
                const signal = await this.aiTrader.analyzeMarket(this.currentSymbol);
                
                if (signal && signal.action !== 'HOLD' && signal.confidence >= this.aiConfidence) {
                    console.log(`🎯 Sinal da IA: ${signal.action} com ${(signal.confidence * 100).toFixed(1)}% de confiança`);
                    
                    // Armazenar sinal
                    this.lastAISignal = signal;
                    
                    // Executar trade baseado no sinal da IA
                    await this.executeAITrade(signal);
                } else if (signal) {
                    console.log(`⏸️ IA recomenda aguardar (confiança: ${(signal.confidence * 100).toFixed(1)}%)`);
                }
                
            } catch (error) {
                console.error('❌ Erro na análise da IA:', error);
            }
        }, this.aiAnalysisInterval);
    }

    // Executar trade baseado no sinal da IA
    async executeAITrade(signal) {
        try {
            console.log(`🎯 Executando trade baseado no sinal da IA: ${signal.action}`);
            
            // Mapear ação da IA para tipo de trade
            const tradeType = signal.action === 'BUY' ? 'CALL' : 'PUT';
            
            // Executar trade
            const result = await this.executeTrade(tradeType, signal);
            
            if (result) {
                this.tradesToday++;
                console.log(`✅ Trade executado com sucesso (${this.tradesToday}/${this.maxTradesPerDay})`);
                
                // Atualizar métricas
                this.updateMetrics(result);
                
                // Atualizar IA com resultado
                if (this.aiTrader) {
                    this.aiTrader.updatePerformance({
                        id: result.id,
                        profit: result.profit,
                        symbol: this.currentSymbol,
                        type: tradeType,
                        timestamp: Date.now()
                    });
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao executar trade da IA:', error);
        }
    }

    // Executar trade
    async executeTrade(type, signal = null) {
        try {
            if (!this.isConnected) {
                throw new Error('WebSocket não conectado');
            }
            
            // Preparar dados do trade
            const tradeData = {
                symbol: this.currentSymbol,
                type: type,
                amount: this.stake,
                duration: this.duration,
                duration_unit: this.durationUnit
            };
            
            // Usar stop loss e take profit da IA se disponível
            if (signal && signal.stopLoss) {
                tradeData.stopLoss = signal.stopLoss;
            }
            if (signal && signal.takeProfit) {
                tradeData.takeProfit = signal.takeProfit;
            }
            
            console.log(`📊 Executando trade:`, tradeData);
            
            // Enviar proposta
            this.ws.send(JSON.stringify({
                proposal: 1,
                ...tradeData
            }));
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout na execução do trade'));
                }, 10000);
                
                // Handler temporário para capturar resultado
                const originalHandler = this.handleMessage.bind(this);
                this.handleMessage = (data) => {
                    originalHandler(data);
                    
                    if (data.msg_type === 'buy') {
                        clearTimeout(timeout);
                        resolve({
                            id: data.buy.contract_id,
                            profit: 0, // Será atualizado quando o contrato finalizar
                            timestamp: Date.now()
                        });
                        this.handleMessage = originalHandler;
                    }
                };
            });
            
        } catch (error) {
            console.error('❌ Erro ao executar trade:', error);
            throw error;
        }
    }

    // Atualizar métricas
    updateMetrics(tradeResult) {
        this.totalProfit += tradeResult.profit;
        
        if (tradeResult.profit > 0) {
            this.winningTrades++;
        } else {
            this.losingTrades++;
        }
        
        console.log(`📊 Métricas atualizadas: Lucro total: $${this.totalProfit.toFixed(2)}, Trades: ${this.winningTrades}W/${this.losingTrades}L`);
    }

    // Obter estatísticas (atualizado)
    getStats() {
        return {
            isRunning: this.isRunning,
            isTrading: this.isTrading,
            useAI: this.useAI,
            aiConfidence: this.aiConfidence,
            currentSymbol: this.currentSymbol,
            tradesToday: this.tradesToday,
            maxTradesPerDay: this.maxTradesPerDay,
            totalProfit: this.totalProfit,
            winningTrades: this.winningTrades,
            losingTrades: this.losingTrades,
            winRate: this.winningTrades + this.losingTrades > 0 ? 
                (this.winningTrades / (this.winningTrades + this.losingTrades)) * 100 : 0,
            lastAISignal: this.lastAISignal,
            lastPrice: this.lastPrice,
            riskStats: this.riskManager.getStats(),
            strategyStats: this.strategy.getStrategyStats()
        };
    }
}

module.exports = AutoTrader;
