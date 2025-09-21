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
        const response = await fetch(getApiUrl('/api/v1/subscription/plans'));
        if (response.ok) {
            const data = await response.json();
            this.plans = data.data.plans || [];
            this.renderPlans();
        }
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
        document.getElementById('subscription-modal').style.display = 'block';
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
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.url) {
                window.location.href = data.data.url;
            }
        }
    } catch (error) {
        console.error('Error selecting plan:', error);
    }
}

    async saveAPICredentials() {
        const apiToken = document.getElementById('api-token').value;
        const appId = document.getElementById('app-id').value;

        if (!apiToken) {
            window.authManager.showToast('Erro', 'Token API é obrigatório', 'error');
            return;
        }

        try {
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
                window.authManager.showToast('Sucesso', 'Credenciais salvas com sucesso', 'success');
                document.getElementById('api-modal').style.display = 'none';
                
                // Atualizar status da API
                document.getElementById('api-status').innerHTML = `
                    <div class="status-indicator connected"></div>
                    <span>API Configurada</span>
                `;
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