class DashboardManager {
    constructor() {
        this.currentSection = 'overview';
    }

    init() {
        console.log('DashboardManager initialized');
        this.bindEvents();
		this.loadDashboardData();
        this.updateMarketTime();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Refresh data
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Upgrade subscription
        document.getElementById('upgrade-subscription').addEventListener('click', () => {
            this.showSubscriptionModal();
        });

        // Configure API
        document.getElementById('configure-api').addEventListener('click', () => {
            this.showAPIModal();
        });

        // User menu
        document.querySelector('.user-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.dropdown-menu').style.display = 
                document.querySelector('.dropdown-menu').style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.querySelector('.dropdown-menu').style.display = 'none';
        });

        // Profile button
        document.getElementById('profile-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileModal();
        });

        // Subscription button
        document.getElementById('subscription-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSubscriptionModal();
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchSection('settings');
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            window.authManager.handleLogout();
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;

        // Load section-specific data
        if (section === 'trading') {
            this.loadTradingData();
        } else if (section === 'history') {
            this.loadHistoryData();
        }
    }

	async loadDashboardData() {
    try {
        console.log('Token:', window.authManager.token); // Debug
        console.log('Auth headers:', window.authManager.getAuthHeaders()); // Debug
        
			const response = await fetch(getApiUrl('/api/v1/trading/dashboard'), {
            headers: window.authManager.getAuthHeaders()
        });

        console.log('Dashboard response status:', response.status); // Debug
        
        if (response.ok) {
            const data = await response.json();
				this.updateDashboard(data.data);
				// Tentar carregar saldo real da Deriv se credenciais existirem
				this.loadDerivBalance().catch(() => {});
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error loading dashboard data:', response.status, errorData);
            
            if (response.status === 401) {
                window.authManager.handleInvalidToken();
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

	async loadDerivBalance() {
		try {
			const response = await fetch(getApiUrl('/api/v1/deriv/balance'), {
				headers: window.authManager.getAuthHeaders()
			});
			if (!response.ok) {
				console.warn('Deriv balance not available:', response.status);
				this.updateDerivStatus(false);
				return;
			}
			const result = await response.json();
			if (result && result.status === 'success' && result.data) {
				const balance = Number(result.data.balance || 0);
				if (!Number.isNaN(balance)) {
					document.getElementById('balance-value').textContent = `$${balance.toFixed(2)}`;
				}
				this.updateDerivStatus(true);
			}
		} catch (e) {
			console.error('Error fetching Deriv balance:', e);
			this.updateDerivStatus(false);
		}
	}

	updateDerivStatus(connected) {
		const derivStatus = document.getElementById('deriv-status');
		if (derivStatus) {
			derivStatus.textContent = connected ? 'Conectado' : 'Desconectado';
			derivStatus.classList.toggle('connected', !!connected);
		}
		const apiStatus = document.getElementById('api-status');
		if (apiStatus) {
			apiStatus.innerHTML = connected
				? '<div class="status-indicator connected"></div><span>API Configurada</span>'
				: '<div class="status-indicator disconnected"></div><span>API Não Configurada</span>';
		}
	}

    updateDashboard(data) {
        document.getElementById('balance-value').textContent = `$${data.balance.toFixed(2)}`;
        document.getElementById('daily-profit').textContent = `$${data.dailyProfit.toFixed(2)}`;
        document.getElementById('open-positions').textContent = data.openPositions;
        document.getElementById('win-rate').textContent = `${data.winRate}%`;
    }

    updateMarketTime() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('market-time').textContent = timeString;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    showSubscriptionModal() {
        // Implementar modal de assinatura
        console.log('Show subscription modal');
        window.subscriptionManager.showPlans();
    }

    showAPIModal() {
        // Abrir modal de API
        console.log('Show API modal');
        const modal = document.getElementById('api-modal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    showProfileModal() {
        // Implementar modal de perfil
        console.log('Show profile modal');
    }

  async loadTradingData() {
    try {
        const [positionsResponse, assetsResponse] = await Promise.all([
            fetch(getApiUrl('/api/v1/trading/positions'), {
                headers: window.authManager.getAuthHeaders()
            }),
            fetch(getApiUrl('/api/v1/deriv/assets'), {
                headers: window.authManager.getAuthHeaders()
            })
        ]);

        // ... resto do código ...
    } catch (error) {
        console.error('Error loading trading data:', error);
    }
}

    updatePositions(positions) {
        const positionsList = document.getElementById('positions-list');
        
        if (positions.length === 0) {
            positionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Nenhuma posição aberta</p>
                </div>
            `;
            return;
        }

        positionsList.innerHTML = positions.map(position => `
            <div class="position-item">
                <div class="position-header">
                    <span class="asset">${position.pair}</span>
                    <span class="type ${position.type.toLowerCase()}">${position.type}</span>
                </div>
                <div class="position-details">
                    <div>Valor: $${position.amount}</div>
                    <div>Entrada: ${position.entryPrice}</div>
                    <div>Atual: ${position.currentPrice}</div>
                    <div class="profit ${position.profit >= 0 ? 'positive' : 'negative'}">
                        P/L: $${position.profit.toFixed(2)}
                    </div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="window.tradingManager.closePosition(${position.id})">
                    Fechar
                </button>
            </div>
        `).join('');
    }

    updateAssets(assets) {
        const assetSelect = document.getElementById('asset-select');
        const tradeAsset = document.getElementById('trade-asset');
        
        assets.forEach(asset => {
            const option = document.createElement('option');
            option.value = asset.symbol;
            option.textContent = `${asset.name} (${asset.symbol})`;
            
            assetSelect.appendChild(option.cloneNode(true));
            tradeAsset.appendChild(option);
        });
    }

    loadHistoryData() {
        // Implementar carregamento do histórico
        console.log('Loading history data');
    }
}

function initDashboardAfterAuth() {
    if (window.authManager && window.authManager.isAuthenticated) {
        window.dashboardManager = new DashboardManager();
        window.dashboardManager.init();
    }
}

document.addEventListener('authStateChanged', initDashboardAfterAuth);
// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});