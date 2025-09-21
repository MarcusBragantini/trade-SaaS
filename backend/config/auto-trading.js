module.exports = {
    // Configurações padrão do trading automático
    DEFAULT_SYMBOL: 'BTCUSD',
    DEFAULT_STAKE: 10,
    DEFAULT_DURATION: 5,
    DEFAULT_DURATION_UNIT: 'm',
    DEFAULT_STRATEGY: 'trend_following',
    
    // Limites de risco padrão
    DEFAULT_MAX_DAILY_LOSS: 100,
    DEFAULT_MAX_CONSECUTIVE_LOSSES: 3,
    DEFAULT_MAX_TRADES_PER_DAY: 50,
    
    // Configurações do WebSocket
    DERIV_WS_URL: 'wss://ws.binaryws.com/websockets/v3?app_id=1089',
    
    // Símbolos disponíveis
    AVAILABLE_SYMBOLS: [
        'BTCUSD',
        'ETHUSD',
        'ADAUSD',
        'DOTUSD',
        'LTCUSD',
        'XRPUSD',
        'LINKUSD',
        'UNIUSD'
    ],
    
    // Estratégias disponíveis
    AVAILABLE_STRATEGIES: [
        'trend_following',
        'mean_reversion',
        'breakout',
        'random'
    ],
    
    // Configurações de reconexão
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 5000, // 5 segundos
    
    // Configurações de log
    LOG_RETENTION: 100, // Manter últimos 100 logs
    STATUS_UPDATE_INTERVAL: 2000, // 2 segundos
};
