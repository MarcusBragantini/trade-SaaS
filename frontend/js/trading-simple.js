class TradingManager {
    constructor() {
        this.initialized = false;
        this.chart = null;
        this.selectedSymbol = 'BTCUSD';
        this.selectedTimeframe = '1m';
    }

    async init() {
        if (this.initialized) return;
        console.log('📈 Inicializando Trading Manager...');
        this.initialized = true;
        this.setupEventListeners();
        await this.loadTradingData();
    }

    setupEventListeners() {
        // Symbol selector
        document.getElementById('symbol-select').addEventListener('change', (e) => {
            this.selectedSymbol = e.target.value;
            this.updateChart();
        });

        // Timeframe selector
        document.getElementById('timeframe-select').addEventListener('change', (e) => {
            this.selectedTimeframe = e.target.value;
            this.updateChart();
        });

        // Direction buttons
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
            });
        });

        // Execute trade button
        document.getElementById('execute-trade-btn').addEventListener('click', () => {
            this.executeTrade();
        });
    }

    async loadTradingData() {
        try {
            console.log('📊 Carregando dados de trading...');
            this.createChart();
            this.addLog('📈 Dados de trading carregados', 'info');
        } catch (error) {
            console.error('Erro ao carregar dados de trading:', error);
            this.addLog('❌ Erro ao carregar dados de trading', 'error');
        }
    }

    createChart() {
        const ctx = document.getElementById('trading-chart');
        if (!ctx) {
            console.error('Canvas do gráfico não encontrado');
            return;
        }

        if (this.chart) {
            this.chart.destroy();
        }

        // Generate sample data
        const data = this.generateSampleData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: `${this.selectedSymbol} - ${this.selectedTimeframe}`,
                    data: data.prices,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Gráfico de Preços - ${this.selectedSymbol} (${this.selectedTimeframe})`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tempo'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Preço ($)'
                        },
                        beginAtZero: false
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        this.addLog(`📊 Gráfico criado para ${this.selectedSymbol} (${this.selectedTimeframe})`, 'info');
    }

    generateSampleData() {
        const basePrice = this.getBasePrice(this.selectedSymbol);
        const volatility = 0.02; // 2% volatility
        const points = 50;
        
        const labels = [];
        const prices = [];
        
        let currentPrice = basePrice;
        
        for (let i = 0; i < points; i++) {
            const time = new Date(Date.now() - (points - i) * 60000); // 1 minute intervals
            labels.push(time.toLocaleTimeString());
            
            // Random walk
            const change = (Math.random() - 0.5) * volatility;
            currentPrice = currentPrice * (1 + change);
            prices.push(currentPrice);
        }
        
        return { labels, prices };
    }

    getBasePrice(symbol) {
        const prices = {
            'BTCUSD': 45000,
            'ETHUSD': 3000,
            'ADAUSD': 0.5,
            'DOTUSD': 7
        };
        return prices[symbol] || 100;
    }

    updateChart() {
        if (this.chart) {
            this.createChart();
        }
    }

    async executeTrade() {
        try {
            const entryAmount = parseFloat(document.getElementById('entry-amount').value);
            const stopLoss = parseFloat(document.getElementById('stop-loss').value);
            const stopWin = parseFloat(document.getElementById('stop-win').value);
            const martingale = document.getElementById('martingale').value;
            const maxMartingale = parseInt(document.getElementById('max-martingale').value);
            
            const activeDirection = document.querySelector('.direction-btn.active');
            if (!activeDirection) {
                this.addLog('❌ Selecione uma direção (COMPRA ou VENDA)', 'error');
                return;
            }
            
            const direction = activeDirection.dataset.direction;
            
            // Validate inputs
            if (!entryAmount || entryAmount <= 0) {
                this.addLog('❌ Valor de entrada inválido', 'error');
                return;
            }
            
            this.addLog(`🚀 Executando trade: ${direction.toUpperCase()} - $${entryAmount}`, 'info');
            
            console.log('🔍 Símbolo selecionado:', this.selectedSymbol);
            console.log('🔍 Direção:', direction);
            console.log('🔍 Valor:', entryAmount);
            
            const tradeData = {
                pair: this.selectedSymbol,
                type: direction.toUpperCase(),
                amount: entryAmount,
                stopLoss: stopLoss,
                takeProfit: stopWin
            };
            
            console.log('📤 Dados do trade sendo enviados:', tradeData);
            
            const response = await fetch(getApiUrl('/api/v1/trading/execute'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tradeData)
            });
            
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        const trade = data.data;
                        const profit = trade.profit || 0;
                        const isWin = profit > 0;
                        const profitText = isWin ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`;
                        
                        this.addLog(`✅ Trade executado! ID: ${trade.id}`, 'success');
                        this.addLog(`💰 Resultado: ${profitText} (${isWin ? 'GANHOU' : 'PERDEU'})`, isWin ? 'success' : 'error');
                        
                        if (trade.simulation) {
                            this.addLog(`🧪 Trade simulado - Para trades reais, configure um token válido da Deriv`, 'warn');
                        }
                        
                        // Update dashboard balance
                        if (window.dashboardManager) {
                            await window.dashboardManager.loadBalanceData();
                        }
                    } else {
                        this.addLog(`❌ Erro na execução: ${data.message}`, 'error');
                    }
                } else {
                    const errorData = await response.json();
                    console.error('❌ Erro na execução do trade:', errorData);
                    this.addLog(`❌ Erro HTTP ${response.status}: ${errorData.message}`, 'error');
                }
            
        } catch (error) {
            console.error('Erro ao executar trade:', error);
            this.addLog(`❌ Erro ao executar trade: ${error.message}`, 'error');
        }
    }

    addLog(message, level = 'info') {
        if (window.logsManager) {
            window.logsManager.addLog(message, level);
        }
    }
}

// Initialize when authenticated
document.addEventListener('authStateChanged', (event) => {
    if (event.detail.isAuthenticated) {
        window.tradingManager = new TradingManager();
        window.tradingManager.init();
    } else {
        if (window.tradingManager) {
            window.tradingManager = null;
        }
    }
});
