class TradingManager {
    constructor() {
        this.isAutoTrading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTradingData();
    }

    bindEvents() {
        // Auto trading toggle
        document.getElementById('auto-trading-toggle').addEventListener('change', (e) => {
            this.toggleAutoTrading(e.target.checked);
        });

        // Trade execution buttons
        document.querySelectorAll('.btn-direction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.prepareTrade(e.target.dataset.direction);
            });
        });

        // Execute trade button
        document.getElementById('execute-trade').addEventListener('click', () => {
            this.executeTrade();
        });

        // Asset selection
        document.getElementById('asset-select').addEventListener('change', (e) => {
            this.updateChart(e.target.value);
        });

        // Timeframe selection
        document.getElementById('timeframe-select').addEventListener('change', (e) => {
            this.updateChartTimeframe(e.target.value);
        });
    }

    toggleAutoTrading(enabled) {
        this.isAutoTrading = enabled;
        if (enabled) {
            this.startAutoTrading();
        } else {
            this.stopAutoTrading();
        }
    }

    startAutoTrading() {
        console.log('Auto trading started');
        // Implementar lógica de trading automático
    }

    stopAutoTrading() {
        console.log('Auto trading stopped');
        // Implementar parada do trading automático
    }

    prepareTrade(direction) {
        const tradeButton = document.getElementById('execute-trade');
        tradeButton.disabled = false;
        tradeButton.dataset.direction = direction;
        
        // Simular recomendação da IA
        this.simulateAIRecommendation(direction);
    }

    simulateAIRecommendation(direction) {
        const confidence = Math.random() * 100;
        const recommendation = document.getElementById('ai-recommendation-text');
        const confidenceElement = document.getElementById('ai-confidence');
        
        recommendation.textContent = `Recomendação: ${direction === 'call' ? 'COMPRA' : 'VENDA'}`;
        confidenceElement.textContent = `Confiança: ${confidence.toFixed(1)}%`;
        
        // Adicionar classe baseada na confiança
        const aiElement = document.getElementById('ai-recommendation');
        aiElement.className = 'ai-recommendation';
        if (confidence > 70) {
            aiElement.classList.add('high-confidence');
        } else if (confidence > 40) {
            aiElement.classList.add('medium-confidence');
        } else {
            aiElement.classList.add('low-confidence');
        }
    }

    async executeTrade() {
        const tradeButton = document.getElementById('execute-trade');
        const direction = tradeButton.dataset.direction;
        const asset = document.getElementById('trade-asset').value;
        const amount = document.getElementById('trade-amount').value;

        try {
            const response = await fetch('/api/v1/trading/execute', {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pair: asset,
                    type: direction.toUpperCase(),
                    amount: parseFloat(amount),
                    stopLoss: 2,
                    takeProfit: 5
                })
            });

            if (response.ok) {
                const data = await response.json();
                window.authManager.showToast('Sucesso', 'Trade executado com sucesso', 'success');
                
                // Recarregar dados
                window.dashboardManager.loadDashboardData();
                window.dashboardManager.loadTradingData();
                
                // Resetar formulário
                tradeButton.disabled = true;
            } else {
                const error = await response.json();
                window.authManager.showToast('Erro', error.message, 'error');
            }
        } catch (error) {
            console.error('Error executing trade:', error);
            window.authManager.showToast('Erro', 'Erro ao executar trade', 'error');
        }
    }

    async closePosition(positionId) {
        try {
            const response = await fetch(`/api/v1/trading/positions/${positionId}/close`, {
                method: 'POST',
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                window.authManager.showToast('Sucesso', 'Posição fechada com sucesso', 'success');
                window.dashboardManager.loadDashboardData();
                window.dashboardManager.loadTradingData();
            } else {
                const error = await response.json();
                window.authManager.showToast('Erro', error.message, 'error');
            }
        } catch (error) {
            console.error('Error closing position:', error);
            window.authManager.showToast('Erro', 'Erro ao fechar posição', 'error');
        }
    }

    updateChart(asset) {
        // Simular atualização do gráfico
        const chartPlaceholder = document.getElementById('trading-view-chart');
        chartPlaceholder.innerHTML = `
            <div class="chart-placeholder">
                <i class="fas fa-chart-line"></i>
                <p>Gráfico de ${asset}</p>
                <small>Preços simulados - Configure a API para dados reais</small>
            </div>
        `;
    }

    updateChartTimeframe(timeframe) {
        console.log('Timeframe changed to:', timeframe);
        // Implementar atualização do timeframe do gráfico
    }

    loadTradingData() {
        // Carregar dados de trading
        this.updateChart('EURUSD');
    }
}

// Initialize trading manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradingManager = new TradingManager();
});