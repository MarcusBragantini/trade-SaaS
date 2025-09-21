class RobotManager {
    constructor() {
        this.isRunning = false;
        this.robotStatus = 'stopped';
        this.tradesToday = 0;
        this.winRate = 0;
        this.pnl = 0;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('🤖 Inicializando Robot Manager...');
        this.initialized = true;
        this.setupEventListeners();
        await this.loadRobotStatus();
    }

    setupEventListeners() {
        document.getElementById('start-robot-btn').addEventListener('click', () => this.startRobot());
        document.getElementById('stop-robot-btn').addEventListener('click', () => this.stopRobot());
    }

    async loadRobotStatus() {
        try {
            const response = await fetch(getApiUrl('/api/v1/auto-trading/status'), {
                headers: window.authManager.getAuthHeaders()
            });
            const data = await response.json();
            if (data.status === 'success') {
                this.updateRobotStatus(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar status do robô:', error);
            this.addLog('❌ Erro ao carregar status do robô.', 'error');
        }
    }

    updateRobotStatus(statusData = {}) {
        this.robotStatus = statusData.status || 'stopped';
        this.tradesToday = statusData.tradesToday || 0;
        this.winRate = statusData.winRate || 0;
        this.pnl = statusData.totalLoss || 0;

        // Update UI
        document.getElementById('robot-status').textContent = this.getStatusText(this.robotStatus);
        document.getElementById('robot-trades-today').textContent = this.tradesToday;
        document.getElementById('robot-win-rate').textContent = `${this.winRate.toFixed(2)}%`;
        document.getElementById('robot-pnl').textContent = `$${this.pnl.toFixed(2)}`;

        // Update status indicator
        const indicator = document.getElementById('robot-status-indicator');
        indicator.className = `status-indicator ${this.robotStatus}`;

        // Update buttons
        document.getElementById('start-robot-btn').disabled = this.robotStatus === 'running';
        document.getElementById('stop-robot-btn').disabled = this.robotStatus !== 'running';

        this.addLog(`🤖 Status do robô atualizado: ${this.getStatusText(this.robotStatus)}`, 'info');
    }

    getStatusText(status) {
        const statusMap = {
            'stopped': 'Parado',
            'running': 'Executando',
            'paused': 'Pausado',
            'error': 'Erro'
        };
        return statusMap[status] || 'Desconhecido';
    }

    async startRobot() {
        try {
            this.addLog('🚀 Iniciando robô de trading...', 'info');
            
            const response = await fetch(getApiUrl('/api/v1/auto-trading/start'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: 'BTCUSD',
                    stake: 10,
                    duration: 5,
                    durationUnit: 'm',
                    strategy: 'trend_following'
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                this.addLog('✅ Robô iniciado com sucesso!', 'success');
                this.updateRobotStatus(data.data);
            } else {
                this.addLog(`❌ Erro ao iniciar robô: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao iniciar robô:', error);
            this.addLog(`❌ Erro ao iniciar robô: ${error.message}`, 'error');
        }
    }

    async stopRobot() {
        try {
            this.addLog('⏹️ Parando robô de trading...', 'info');
            
            const response = await fetch(getApiUrl('/api/v1/auto-trading/stop'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                this.addLog('✅ Robô parado com sucesso!', 'success');
                this.robotStatus = 'stopped';
                this.updateRobotStatus();
            } else {
                this.addLog(`❌ Erro ao parar robô: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao parar robô:', error);
            this.addLog(`❌ Erro ao parar robô: ${error.message}`, 'error');
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
        window.robotManager = new RobotManager();
        window.robotManager.init();
    } else {
        if (window.robotManager) {
            window.robotManager = null;
        }
    }
});
