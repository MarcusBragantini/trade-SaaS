class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
    }

    async init() {
        console.log('AuthManager initializing...');
        await this.waitForDOM();
        this.bindEvents();
        await this.checkAuthStatus();
    }

    async waitForDOM() {
        // Esperar o DOM estar completamente carregado
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Verificar se os elementos existem
        const authModal = document.getElementById('auth-modal');
        const loginBtn = document.getElementById('login-btn');
        
        if (!authModal) {
            console.error('Auth modal not found!');
            return;
        }
        
        if (!loginBtn) {
            console.error('Login button not found!');
            return;
        }
        
        console.log('DOM elements found successfully');
    }

    bindEvents() {
        console.log('Binding auth events...');
        
        // Auth modal events
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.handleLogin();
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.handleRegister();
            });
        }

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Logout event (se existir)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        console.log('Auth events bound successfully');
    }

    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitle = document.getElementById('auth-modal-title');
        
        if (loginForm && registerForm && authTitle) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            authTitle.textContent = 'Entrar no ForexAI';
        }
    }

    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitle = document.getElementById('auth-modal-title');
        
        if (loginForm && registerForm && authTitle) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authTitle.textContent = 'Criar Conta ForexAI';
        }
    }

    showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'block';
            this.showLoginForm();
            console.log('Auth modal shown');
        } else {
            console.error('Cannot show auth modal - element not found');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    async checkAuthStatus() {
        console.log('Checking authentication status...');
        console.log('Token in storage:', this.token);
        
        if (this.token) {
            try {
                console.log('Testing token validity...');
                const response = await fetch(getApiUrl('/api/v1/auth/profile'), {
                    headers: this.getAuthHeaders()
                });

                console.log('Profile response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    this.isAuthenticated = true;
                    this.currentUser = data.data.user;
                    this.showDashboard();
                    console.log('User authenticated successfully:', this.currentUser.email);
                } else {
                    console.log('Token invalid or expired');
                    this.handleInvalidToken();
                }
            } catch (error) {
                console.error('Auth check error:', error);
                this.handleInvalidToken();
            }
        } else {
            console.log('No token found, showing login');
            this.showAuthModal();
        }
    }

    handleInvalidToken() {
        console.log('Handling invalid token');
        localStorage.removeItem('authToken');
        this.token = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        this.showAuthModal();
        this.showToast('Sessão expirada', 'Por favor, faça login novamente', 'warning');
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showToast('Erro', 'Por favor, preencha todos os campos', 'error');
            return;
        }

        try {
            console.log('Attempting login for:', email);
            const response = await fetch(getApiUrl('/api/v1/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                this.token = data.data.token;
                localStorage.setItem('authToken', this.token);
                this.isAuthenticated = true;
                this.currentUser = data.data.user;
                
                this.closeAllModals();
                this.showDashboard();
                this.showToast('Sucesso', 'Login realizado com sucesso', 'success');
            } else {
                this.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Erro', 'Erro de conexão. Tente novamente.', 'error');
        }
    }

    async handleRegister() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Erro', 'Por favor, preencha todos os campos', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Erro', 'As senhas não coincidem', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Erro', 'A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            const response = await fetch(getApiUrl('/api/v1/auth/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Sucesso', 'Conta criada com sucesso! Faça login para continuar.', 'success');
                this.showLoginForm();
                
                // Clear registration form
                document.getElementById('reg-name').value = '';
                document.getElementById('reg-email').value = '';
                document.getElementById('reg-password').value = '';
                document.getElementById('reg-confirm-password').value = '';
            } else {
                this.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Erro', 'Erro de conexão. Tente novamente.', 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('authToken');
        this.token = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.showAuthModal();
        this.showToast('Info', 'Logout realizado com sucesso', 'info');
    }

    showDashboard() {
        const loadingScreen = document.getElementById('loading-screen');
        const dashboard = document.getElementById('dashboard');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        console.log('Dashboard shown');
        
        // Initialize dashboard components if they exist
        if (typeof window.dashboardManager !== 'undefined') {
            window.dashboardManager.init();
        }
    }

    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error('Toast container not found');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        if (type === 'warning') icon = 'fas fa-exclamation-triangle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getAuthHeaders() {
        if (!this.token) {
            console.warn('No token available for auth headers');
            return {
                'Content-Type': 'application/json'
            };
        }

        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Initialize auth manager when everything is ready
async function initializeApp() {
    console.log('Initializing ForexAI Trading System...');
    window.authManager = new AuthManager();
    await window.authManager.init();
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}