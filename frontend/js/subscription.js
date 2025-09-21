class SubscriptionManager {
    constructor() {
        this.plans = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPlans();
    }

    bindEvents() {
        // Close modal buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Save API credentials
        document.getElementById('save-api-btn').addEventListener('click', () => {
            this.saveAPICredentials();
        });

        // Plan selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-plan')) {
                this.selectPlan(e.target.dataset.plan, e.target.dataset.interval);
            }
        });
    }

async loadPlans() {
    try {
        const response = await fetch(getApiUrl('/api/v1/subscription/plans'), {
            headers: window.authManager.getAuthHeaders()
        });

        // ... resto do código ...
    } catch (error) {
        console.error('Error loading plans:', error);
    }
}

    renderPlans() {
        const container = document.getElementById('plans-container');
        container.innerHTML = this.plans.map(plan => `
            <div class="plan-card ${plan.id === 'free' ? 'free' : ''}">
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <div class="plan-price">
                        ${plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}/mês`}
                    </div>
                </div>
                <div class="plan-features">
                    ${plan.features.map(feature => `
                        <div class="feature-item">
                            <i class="fas fa-check"></i>
                            <span>${feature}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="plan-limitations">
                    <strong>Limitações:</strong>
                    <div>Trades diários: ${plan.limitations.dailyTrades}</div>
                    <div>Análise IA: ${plan.limitations.aiAnalysis ? 'Sim' : 'Não'}</div>
                    <div>Trading automático: ${plan.limitations.autoTrading ? 'Sim' : 'Não'}</div>
                </div>
                ${plan.id !== 'free' ? `
                    <div class="plan-actions">
                        <button class="btn btn-primary select-plan" 
                                data-plan="${plan.id}" 
                                data-interval="monthly">
                            Assinar Mensal
                        </button>
                        <button class="btn btn-secondary select-plan" 
                                data-plan="${plan.id}" 
                                data-interval="yearly">
                            Assinar Anual (20% off)
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    showPlans() {
        const subscriptionModal = document.getElementById('subscription-modal');
        subscriptionModal.style.display = 'block';
        subscriptionModal.classList.add('show');
    }

async selectPlan(planId, interval) {
    try {
        const response = await fetch(getApiUrl('/api/v1/subscription/create-checkout-session'), {
            method: 'POST',
            headers: {
                ...window.authManager.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                planId,
                interval
            })
        });

        // ... resto do código ...
    } catch (error) {
        console.error('Error selecting plan:', error);
    }
}

    async saveAPICredentials() {
        console.log('💾 Saving API credentials...');
        const apiToken = document.getElementById('api-token').value.trim();
        const appId = document.getElementById('app-id').value.trim();

        if (!apiToken) {
            window.authManager.showToast('Erro', 'Token API é obrigatório', 'error');
            return;
        }

        // Validar formato do token (tokens da Deriv geralmente têm 13 caracteres)
        if (apiToken.length < 10) {
            window.authManager.showToast('Erro', 'Token API parece inválido. Tokens da Deriv têm pelo menos 10 caracteres.', 'error');
            return;
        }

        try {
            console.log('📡 Sending request to save credentials...');
            const response = await fetch(getApiUrl('/api/v1/auth/deriv-credentials'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiToken,
                    appId
                })
            });

            if (response.ok) {
                console.log('✅ API credentials saved successfully');
                window.authManager.showToast('Sucesso', 'Credenciais salvas com sucesso', 'success');
                this.closeModals();
                
                // Atualizar status da API
                document.getElementById('api-status').innerHTML = `
                    <div class="status-indicator connected"></div>
                    <span>API Configurada</span>
                `;
                
                // Recarregar dados do dashboard
                console.log('🔄 Reloading dashboard data...');
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                } else {
                    console.error('❌ Dashboard manager not found!');
                }
            } else {
                const error = await response.json();
                window.authManager.showToast('Erro', error.message, 'error');
            }
        } catch (error) {
            console.error('Error saving API credentials:', error);
            window.authManager.showToast('Erro', 'Erro ao salvar credenciais', 'error');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }

    async getCurrentSubscription() {
        try {
            const response = await fetch(getApiUrl('/api/v1/subscription/current'), {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSubscriptionStatus(data.data);
            }
        } catch (error) {
            console.error('Error getting subscription:', error);
        }
    }

    updateSubscriptionStatus(subscriptionData) {
        const statusElement = document.getElementById('subscription-status');
        
        if (subscriptionData.subscription.status === 'active') {
            statusElement.innerHTML = `
                <div class="status-indicator connected"></div>
                <span>Assinatura Ativa (${subscriptionData.subscription.plan})</span>
            `;
        } else {
            statusElement.innerHTML = `
                <div class="status-indicator inactive"></div>
                <span>Assinatura Inativa</span>
            `;
        }
    }
}

// Initialize subscription manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionManager = new SubscriptionManager();
});