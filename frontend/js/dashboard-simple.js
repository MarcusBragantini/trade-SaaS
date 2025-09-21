class DashboardManager {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('📊 Inicializando Dashboard Manager...');
        this.initialized = true;
        this.setupEventListeners();
        await this.loadDashboardData();
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-dashboard-btn').addEventListener('click', () => {
            this.loadDashboardData();
        });
    }

    async loadDashboardData() {
        try {
            console.log('🔄 Carregando dados do dashboard...');
            
            // Load user data
            await this.loadUserData();
            
            // Load subscription data
            await this.loadSubscriptionData();
            
            // Load balance data
            await this.loadBalanceData();
            
            console.log('✅ Dashboard carregado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
            this.addLog(`❌ Erro ao carregar dashboard: ${error.message}`, 'error');
        }
    }

    async loadUserData() {
        try {
            const response = await fetch(getApiUrl('/api/v1/auth/profile'), {
                headers: window.authManager.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    const user = data.data.user;
                    document.getElementById('user-name-display').textContent = user.name || 'Usuário';
                    document.getElementById('user-email-display').textContent = user.email || '-';
                    document.getElementById('user-name').textContent = user.name || 'Usuário';
                    document.getElementById('user-plan').textContent = user.plan || 'Free';
                    
                    this.addLog(`👤 Dados do usuário carregados: ${user.name}`, 'info');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            this.addLog('❌ Erro ao carregar dados do usuário', 'error');
        }
    }

    async loadSubscriptionData() {
        try {
            const response = await fetch(getApiUrl('/api/v1/subscription/current'), {
                headers: window.authManager.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    const subscription = data.data;
                    document.getElementById('subscription-plan').textContent = subscription.plan || 'Plano Básico';
                    
                    const statusElement = document.getElementById('subscription-status');
                    const statusText = statusElement.querySelector('.status-text');
                    const statusIndicator = statusElement.querySelector('.status-indicator');
                    
                    if (subscription.isActive) {
                        statusText.textContent = 'Ativa';
                        statusIndicator.className = 'status-indicator active';
                    } else {
                        statusText.textContent = 'Inativa';
                        statusIndicator.className = 'status-indicator inactive';
                    }
                    
                    if (subscription.expiresAt) {
                        const expiryDate = new Date(subscription.expiresAt);
                        document.getElementById('subscription-validity').textContent = 
                            `Válida até: ${expiryDate.toLocaleDateString()}`;
                    }
                    
                    this.addLog(`👑 Dados da assinatura carregados: ${subscription.plan}`, 'info');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados da assinatura:', error);
            this.addLog('❌ Erro ao carregar dados da assinatura', 'error');
        }
    }

    async loadBalanceData() {
        try {
            const response = await fetch(getApiUrl('/api/v1/trading/dashboard'), {
                headers: window.authManager.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    const balance = data.data.balance || 0;
                    document.getElementById('current-balance').textContent = `$${balance.toFixed(2)}`;
                    
                    this.addLog(`💰 Saldo carregado: $${balance.toFixed(2)}`, 'info');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar saldo:', error);
            this.addLog('❌ Erro ao carregar saldo', 'error');
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
        window.dashboardManager = new DashboardManager();
        window.dashboardManager.init();
    } else {
        if (window.dashboardManager) {
            window.dashboardManager = null;
        }
    }
});
