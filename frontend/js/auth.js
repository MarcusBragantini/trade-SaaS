class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
    }

    async init() {
        console.log('AuthManager initializing...');
        await this.waitForDOM();
        
        // Auto-login para desenvolvimento
        const autoLoginSuccess = await this.autoLogin();
        
        // Atualizar token após auto-login
        if (autoLoginSuccess) {
            this.token = localStorage.getItem('authToken');
        }
        
        this.bindEvents();
        await this.checkAuthStatus();
    }

    async autoLogin() {
        try {
            console.log('🚀 Auto-login ativado para desenvolvimento...');
            const response = await fetch(getApiUrl('/api/v1/auth/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'bragantini34@gmail.com',
                    password: 'Mvb081521'
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Resposta completa do auto-login:', data);
                
                if (data.status === 'success') {
                    // O token está em data.data.token, não em data.token
                    const token = data.data?.token;
                    const user = data.data?.user;
                    
                    if (token) {
                        localStorage.setItem('authToken', token);
                        localStorage.setItem('user', JSON.stringify(user));
                        console.log('✅ Auto-login realizado com sucesso!');
                        console.log('🔑 Token salvo:', token.substring(0, 20) + '...');
                        console.log('👤 Usuário salvo:', user);
                        return true;
                    } else {
                        console.error('❌ Token não encontrado na resposta:', data);
                    }
                } else {
                    console.error('❌ Auto-login falhou:', data.message);
                }
            } else {
                console.error('❌ Erro HTTP no auto-login:', response.status);
                const errorText = await response.text();
                console.error('❌ Detalhes do erro:', errorText);
            }
        } catch (error) {
            console.log('⚠️ Auto-login falhou, usuário precisa fazer login manual:', error.message);
        }
        return false;
    }

    async waitForDOM() {
        // Esperar o DOM estar completamente carregado
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Verificar se os elementos existem (opcional para sistema simplificado)
        const authModal = document.getElementById('auth-modal');
        const loginBtn = document.getElementById('login-btn');
        
        if (!authModal) {
            console.log('Auth modal not found - using simplified system');
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
            console.log('Cannot show auth modal - element not found (simplified system)');
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
        
        // Verificar token no localStorage também
        const localStorageToken = localStorage.getItem('authToken');
        console.log('Token no localStorage:', localStorageToken ? 'Presente' : 'Ausente');
        
        if (this.token || localStorageToken) {
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
                    
                    // Dispatch auth state changed event
                    document.dispatchEvent(new CustomEvent('authStateChanged', {
                        detail: { isAuthenticated: true, user: this.currentUser }
                    }));
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
            // Verificar se existe modal antes de tentar mostrar
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                this.showAuthModal();
            } else {
                console.log('No auth modal found - using simplified system');
            }
        }
    }

    handleInvalidToken() {
        console.log('Handling invalid token');
        localStorage.removeItem('authToken');
        this.token = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Verificar se existe modal antes de tentar mostrar
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            this.showAuthModal();
        } else {
            console.log('No auth modal found - using simplified system');
        }
        
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

            // Verificar se é rate limiting antes de tentar fazer parse do JSON
            if (response.status === 429) {
                this.showToast('Rate Limiting', 'Muitas tentativas de login. Aguarde 15 minutos.', 'warning');
                return;
            }

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
                
                // Dispatch auth state changed event
                document.dispatchEvent(new CustomEvent('authStateChanged'));
            } else {
                this.showToast('Erro', data.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Verificar se é erro de rate limiting
            if (error.message && error.message.includes('Too many')) {
                this.showToast('Rate Limiting', 'Muitas tentativas de login. Aguarde 15 minutos.', 'warning');
            } else {
                this.showToast('Erro', 'Erro de conexão. Tente novamente.', 'error');
            }
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
        // Sempre verificar o localStorage para o token mais recente
        const currentToken = localStorage.getItem('authToken');
        
        console.log('🔑 getAuthHeaders - Token encontrado:', currentToken ? 'Sim' : 'Não');
        if (currentToken) {
            console.log('🔑 Token (primeiros 20 chars):', currentToken.substring(0, 20) + '...');
        }
        
        if (!currentToken) {
            console.warn('No token available for auth headers');
            return {
                'Content-Type': 'application/json'
            };
        }

        return {
            'Authorization': `Bearer ${currentToken}`,
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