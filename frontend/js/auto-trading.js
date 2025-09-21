class AutoTradingManager {
    constructor() {
        this.isActive = false;
        this.statusInterval = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log('🤖 Inicializando Auto Trading Manager...');
        this.setupEventListeners();
        this.initialized = true;
    }

    setupEventListeners() {
        // Botões de controle
        document.getElementById('start-auto-trading-btn').addEventListener('click', () => {
            this.startAutoTrading();
        });

        document.getElementById('stop-auto-trading-btn').addEventListener('click', () => {
            this.stopAutoTrading();
        });

        // Botões de configuração
        document.getElementById('update-risk-limits-btn').addEventListener('click', () => {
            this.updateRiskLimits();
        });

        document.getElementById('reactivate-trading-btn').addEventListener('click', () => {
            this.reactivateTrading();
        });

        // Carregar estratégias disponíveis
        this.loadStrategies();
    }

    async loadStrategies() {
        try {
            const response = await fetch(getApiUrl('/api/v1/auto-trading/strategies'), {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                const strategySelect = document.getElementById('auto-strategy');
                
                // Limpar opções existentes
                strategySelect.innerHTML = '';
                
                // Adicionar estratégias disponíveis
                data.data.available.forEach(strategy => {
                    const option = document.createElement('option');
                    option.value = strategy;
                    option.textContent = this.getStrategyDisplayName(strategy);
                    strategySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar estratégias:', error);
        }
    }

    getStrategyDisplayName(strategy) {
        const names = {
            'trend_following': 'Seguimento de Tendência',
            'mean_reversion': 'Reversão à Média',
            'breakout': 'Breakout',
            'random': 'Aleatória'
        };
        return names[strategy] || strategy;
    }

    async startAutoTrading() {
        try {
            const config = this.getConfiguration();
            
            this.addLog('🚀 Iniciando trading automático...');
            
            const response = await fetch(getApiUrl('/api/v1/auto-trading/start'), {
                method: 'POST',
                headers: window.authManager.getAuthHeaders(),
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (response.ok) {
                this.isActive = true;
                this.updateUI(true);
                this.startStatusUpdates();
                this.addLog('✅ Trading automático iniciado com sucesso!');
                window.authManager.showToast('Sucesso', 'Trading automático iniciado', 'success');
            } else {
                this.addLog(`❌ Erro ao iniciar: ${data.message}`);
                window.authManager.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao iniciar trading automático:', error);
            this.addLog(`❌ Erro de conexão: ${error.message}`);
            window.authManager.showToast('Erro', 'Erro de conexão', 'error');
        }
    }

    async stopAutoTrading() {
        try {
            this.addLog('⏹️ Parando trading automático...');
            
            const response = await fetch(getApiUrl('/api/v1/auto-trading/stop'), {
                method: 'POST',
                headers: window.authManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.isActive = false;
                this.updateUI(false);
                this.stopStatusUpdates();
                this.addLog('✅ Trading automático parado');
                window.authManager.showToast('Sucesso', 'Trading automático parado', 'success');
            } else {
                this.addLog(`❌ Erro ao parar: ${data.message}`);
                window.authManager.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao parar trading automático:', error);
            this.addLog(`❌ Erro de conexão: ${error.message}`);
            window.authManager.showToast('Erro', 'Erro de conexão', 'error');
        }
    }

    async updateRiskLimits() {
        try {
            const limits = {
                maxDailyLoss: parseFloat(document.getElementById('max-daily-loss').value),
                maxConsecutiveLosses: parseInt(document.getElementById('max-consecutive-losses').value),
                maxTradesPerDay: parseInt(document.getElementById('max-trades-per-day').value)
            };

            this.addLog('⚙️ Atualizando limites de risco...');
            
            const response = await fetch(getApiUrl('/api/v1/auto-trading/risk-limits'), {
                method: 'POST',
                headers: window.authManager.getAuthHeaders(),
                body: JSON.stringify(limits)
            });

            const data = await response.json();

            if (response.ok) {
                this.addLog('✅ Limites de risco atualizados');
                window.authManager.showToast('Sucesso', 'Limites atualizados', 'success');
            } else {
                this.addLog(`❌ Erro ao atualizar limites: ${data.message}`);
                window.authManager.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao atualizar limites:', error);
            this.addLog(`❌ Erro de conexão: ${error.message}`);
            window.authManager.showToast('Erro', 'Erro de conexão', 'error');
        }
    }

    async reactivateTrading() {
        try {
            this.addLog('🔄 Reativando trading...');
            
            const response = await fetch(getApiUrl('/api/v1/auto-trading/reactivate'), {
                method: 'POST',
                headers: window.authManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                this.addLog('✅ Trading reativado');
                window.authManager.showToast('Sucesso', 'Trading reativado', 'success');
            } else {
                this.addLog(`❌ Erro ao reativar: ${data.message}`);
                window.authManager.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao reativar trading:', error);
            this.addLog(`❌ Erro de conexão: ${error.message}`);
            window.authManager.showToast('Erro', 'Erro de conexão', 'error');
        }
    }

    getConfiguration() {
        return {
            symbol: document.getElementById('auto-symbol').value,
            stake: parseFloat(document.getElementById('auto-stake').value),
            duration: parseInt(document.getElementById('auto-duration').value),
            durationUnit: document.getElementById('auto-duration-unit').value,
            strategy: document.getElementById('auto-strategy').value
        };
    }

    updateUI(isActive) {
        const startBtn = document.getElementById('start-auto-trading-btn');
        const stopBtn = document.getElementById('stop-auto-trading-btn');
        const reactivateBtn = document.getElementById('reactivate-trading-btn');

        if (isActive) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            document.getElementById('auto-status').textContent = 'Ativo';
            document.getElementById('auto-status').className = 'status-value status-active';
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            document.getElementById('auto-status').textContent = 'Parado';
            document.getElementById('auto-status').className = 'status-value status-stopped';
        }
    }

    startStatusUpdates() {
        this.statusInterval = setInterval(() => {
            this.updateStatus();
        }, 2000); // Atualizar a cada 2 segundos
    }

    stopStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    async updateStatus() {
        try {
            const response = await fetch(getApiUrl('/api/v1/auto-trading/status'), {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStatusDisplay(data.data);
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    }

    updateStatusDisplay(status) {
        // Atualizar status básico
        document.getElementById('auto-current-symbol').textContent = status.currentSymbol || '-';
        document.getElementById('auto-last-price').textContent = status.lastPrice ? `$${status.lastPrice.toFixed(4)}` : '-';
        
        // Atualizar estatísticas de risco
        if (status.riskStats) {
            document.getElementById('auto-trades-today').textContent = status.riskStats.trades || 0;
            document.getElementById('auto-win-rate').textContent = `${status.riskStats.winRate || 0}%`;
            document.getElementById('auto-total-loss').textContent = `$${(status.riskStats.totalLoss || 0).toFixed(2)}`;
            
            // Atualizar botão de reativação
            const reactivateBtn = document.getElementById('reactivate-trading-btn');
            reactivateBtn.disabled = status.riskStats.isTradingAllowed;
        }

        // Atualizar status de trading
        if (status.isTrading) {
            document.getElementById('auto-status').textContent = 'Trading Ativo';
            document.getElementById('auto-status').className = 'status-value status-trading';
        } else if (status.isConnected) {
            document.getElementById('auto-status').textContent = 'Conectado';
            document.getElementById('auto-status').className = 'status-value status-connected';
        } else {
            document.getElementById('auto-status').textContent = 'Desconectado';
            document.getElementById('auto-status').className = 'status-value status-disconnected';
        }
    }

    addLog(message) {
        const logContainer = document.getElementById('auto-trading-log');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString();
        logEntry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-message">${message}</span>
        `;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Manter apenas os últimos 100 logs
        while (logContainer.children.length > 100) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
}

// Initialize auto trading manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, creating auto trading manager');
    window.autoTradingManager = new AutoTradingManager();
    
    // Initialize when auth state changes
    document.addEventListener('authStateChanged', () => {
        if (window.authManager.isAuthenticated()) {
            window.autoTradingManager.init();
        }
    });
});
