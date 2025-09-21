class LogsManager {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('📝 Inicializando Logs Manager...');
        this.initialized = true;
        this.setupEventListeners();
        this.addLog('📝 Sistema de logs inicializado', 'info');
    }

    setupEventListeners() {
        document.getElementById('clear-logs-btn').addEventListener('click', () => this.clearLogs());
    }

    addLog(message, level = 'info') {
        const timestamp = new Date();
        const logEntry = {
            timestamp,
            level,
            message
        };

        this.logs.unshift(logEntry); // Add to beginning

        // Keep only max logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        this.updateLogsDisplay();
    }

    updateLogsDisplay() {
        const logsContainer = document.getElementById('system-logs');
        if (!logsContainer) return;

        logsContainer.innerHTML = '';

        this.logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${log.level}`;
            
            const timeString = log.timestamp.toLocaleTimeString();
            const levelText = this.getLevelText(log.level);
            
            logElement.innerHTML = `
                <span class="log-time">[${timeString}]</span>
                <span class="log-level ${log.level}">[${levelText}]</span>
                <span class="log-message">${log.message}</span>
            `;
            
            logsContainer.appendChild(logElement);
        });
    }

    getLevelText(level) {
        const levelMap = {
            'info': 'INFO',
            'success': 'SUCCESS',
            'warning': 'WARNING',
            'error': 'ERROR',
            'debug': 'DEBUG'
        };
        return levelMap[level] || 'INFO';
    }

    clearLogs() {
        this.logs = [];
        this.updateLogsDisplay();
        this.addLog('🧹 Logs limpos pelo usuário', 'info');
    }

    // Public method to add logs from other components
    log(message, level = 'info') {
        this.addLog(message, level);
    }
}

// Initialize when authenticated
document.addEventListener('authStateChanged', (event) => {
    if (event.detail.isAuthenticated) {
        window.logsManager = new LogsManager();
        window.logsManager.init();
    } else {
        if (window.logsManager) {
            window.logsManager = null;
        }
    }
});
