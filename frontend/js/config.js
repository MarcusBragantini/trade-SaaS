// Configuração da API
const RESOLVED_BASE = (typeof window !== 'undefined' && window.API_BASE)
    ? window.API_BASE
    : (typeof location !== 'undefined' && location.origin && location.origin.startsWith('http'))
        ? location.origin
        : 'http://localhost:5000';

const API_CONFIG = {
    BASE_URL: RESOLVED_BASE.replace(/\/$/, ''),
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/v1/auth/login',
            REGISTER: '/api/v1/auth/register',
            PROFILE: '/api/v1/auth/profile',
            DERIV_CREDENTIALS: '/api/v1/auth/deriv-credentials'
        },
        TRADING: {
            DASHBOARD: '/api/v1/trading/dashboard',
            EXECUTE: '/api/v1/trading/execute',
            POSITIONS: '/api/v1/trading/positions',
            HISTORY: '/api/v1/trading/history'
        },
        SUBSCRIPTION: {
            PLANS: '/api/v1/subscription/plans',
            CURRENT: '/api/v1/subscription/current',
            CREATE_CHECKOUT: '/api/v1/subscription/create-checkout-session'
        },
        DERIV: {
            ASSETS: '/api/v1/deriv/assets',
            PRICES: '/api/v1/deriv/prices',
            BALANCE: '/api/v1/deriv/balance',
            STATUS: '/api/v1/deriv/status'
        }
    }
};

// Função para construir URLs completas
function getApiUrl(endpoint) {
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    if (!API_CONFIG.BASE_URL) return endpoint; // relativo ao mesmo host
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}