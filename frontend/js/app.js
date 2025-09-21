class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        console.log('🚀 Inicializando aplicação...');
        this.initialized = true;
        
        this.setupEventListeners();
        this.setupNavigation();
        this.startMarketTime();
        
        // Initialize managers when authenticated
        document.addEventListener('authStateChanged', (event) => {
            if (event.detail.isAuthenticated) {
                this.initializeManagers();
            }
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Refresh dashboard
        document.getElementById('refresh-dashboard-btn').addEventListener('click', () => {
            this.refreshDashboard();
        });
    }

    setupNavigation() {
        // Set active navigation item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === this.currentSection) {
                item.classList.add('active');
            }
        });
    }

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            this.setupNavigation();
            
            // Load section data
            this.loadSectionData(sectionName);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                if (window.dashboardManager) {
                    await window.dashboardManager.loadDashboardData();
                }
                break;
            case 'trading':
                if (window.tradingManager) {
                    await window.tradingManager.loadTradingData();
                }
                break;
            case 'robot':
                if (window.robotManager) {
                    await window.robotManager.loadRobotStatus();
                }
                break;
            case 'logs':
                // Logs are already loaded
                break;
        }
    }

    async refreshDashboard() {
        if (window.dashboardManager) {
            await window.dashboardManager.loadDashboardData();
        }
    }

    startMarketTime() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            const marketTimeElement = document.getElementById('market-time');
            if (marketTimeElement) {
                marketTimeElement.textContent = timeString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    initializeManagers() {
        // Initialize all managers
        if (window.dashboardManager) {
            window.dashboardManager.init();
        }
        if (window.tradingManager) {
            window.tradingManager.init();
        }
        if (window.robotManager) {
            window.robotManager.init();
        }
        if (window.logsManager) {
            window.logsManager.init();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
