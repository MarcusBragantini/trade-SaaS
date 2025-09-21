class AIAnalysisManager {
    constructor() {
        this.currentSymbol = 'EURUSD';
        this.isAnalyzing = false;
        this.analysisInterval = null;
        this.availableCurrencies = [];
        this.currentAnalysis = null;
        
        this.init();
    }

    async init() {
        console.log('🤖 Inicializando AI Analysis Manager...');
        await this.loadAvailableCurrencies();
        this.bindEvents();
        this.updateUI();
    }

    async loadAvailableCurrencies() {
        try {
            console.log('📊 Carregando moedas disponíveis...');
            const response = await fetch(getApiUrl('/api/v1/ai/currencies'), {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.availableCurrencies = data.data.currencies;
                console.log('✅ Moedas carregadas:', this.availableCurrencies);
                this.updateCurrencySelector();
            } else {
                console.error('❌ Erro ao carregar moedas:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar moedas:', error);
        }
    }

    updateCurrencySelector() {
        const selector = document.getElementById('currency-selector');
        if (!selector) return;

        selector.innerHTML = '';
        
        this.availableCurrencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency.symbol;
            option.textContent = `${currency.symbol} - ${currency.description}`;
            if (currency.isOpen) {
                option.textContent += ' 🟢';
            } else {
                option.textContent += ' 🔴';
            }
            selector.appendChild(option);
        });

        // Selecionar a primeira moeda por padrão
        if (this.availableCurrencies.length > 0) {
            this.currentSymbol = this.availableCurrencies[0].symbol;
            selector.value = this.currentSymbol;
        }
    }

    bindEvents() {
        // Seletor de moeda
        const currencySelector = document.getElementById('currency-selector');
        if (currencySelector) {
            currencySelector.addEventListener('change', (e) => {
                this.currentSymbol = e.target.value;
                this.performAnalysis();
            });
        }

        // Botão de análise
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.performAnalysis();
            });
        }

        // Botão de análise automática
        const autoAnalyzeBtn = document.getElementById('auto-analyze-btn');
        if (autoAnalyzeBtn) {
            autoAnalyzeBtn.addEventListener('click', () => {
                this.toggleAutoAnalysis();
            });
        }

        // Botão de configurações
        const settingsBtn = document.getElementById('ai-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }

    async performAnalysis() {
        if (this.isAnalyzing) return;

        try {
            this.isAnalyzing = true;
            this.updateAnalyzeButton(true);

            console.log(`🔍 Analisando ${this.currentSymbol}...`);
            
            const response = await fetch(getApiUrl('/api/v1/ai/analyze'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: this.currentSymbol,
                    timeframe: '1m'
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentAnalysis = data.data;
                this.displayAnalysis(this.currentAnalysis);
                console.log('✅ Análise concluída:', this.currentAnalysis);
            } else {
                const errorData = await response.json();
                console.error('❌ Erro na análise:', errorData);
                window.authManager.showToast('Erro', errorData.message, 'error');
            }
        } catch (error) {
            console.error('❌ Erro na análise:', error);
            window.authManager.showToast('Erro', 'Erro ao realizar análise', 'error');
        } finally {
            this.isAnalyzing = false;
            this.updateAnalyzeButton(false);
        }
    }

    displayAnalysis(analysis) {
        // Atualizar informações básicas
        document.getElementById('analysis-symbol').textContent = analysis.symbol;
        document.getElementById('analysis-timestamp').textContent = new Date(analysis.timestamp).toLocaleString();

        // Atualizar sinais
        const trendElement = document.getElementById('trend-signal');
        const strengthElement = document.getElementById('strength-value');
        const confidenceElement = document.getElementById('confidence-value');

        if (trendElement) {
            trendElement.textContent = analysis.signals.trend.toUpperCase();
            trendElement.className = `trend-${analysis.signals.trend}`;
        }

        if (strengthElement) {
            strengthElement.textContent = `${analysis.signals.strength}%`;
        }

        if (confidenceElement) {
            confidenceElement.textContent = `${analysis.signals.confidence}%`;
        }

        // Atualizar indicadores
        this.updateIndicators(analysis.indicators);

        // Atualizar recomendação
        this.updateRecommendation(analysis.recommendation);

        // Atualizar condições de mercado
        this.updateMarketConditions(analysis.marketConditions);
    }

    updateIndicators(indicators) {
        // RSI
        const rsiElement = document.getElementById('rsi-value');
        if (rsiElement) {
            rsiElement.textContent = indicators.rsi.toFixed(2);
            rsiElement.className = this.getRSIClass(indicators.rsi);
        }

        // MACD
        const macdElement = document.getElementById('macd-signal');
        if (macdElement) {
            macdElement.textContent = indicators.macd.signal.toUpperCase();
            macdElement.className = `macd-${indicators.macd.signal}`;
        }

        // Médias móveis
        const sma20Element = document.getElementById('sma20-value');
        const sma50Element = document.getElementById('sma50-value');
        const ema12Element = document.getElementById('ema12-value');

        if (sma20Element) sma20Element.textContent = indicators.movingAverages.sma20.toFixed(4);
        if (sma50Element) sma50Element.textContent = indicators.movingAverages.sma50.toFixed(4);
        if (ema12Element) ema12Element.textContent = indicators.movingAverages.ema12.toFixed(4);
    }

    updateRecommendation(recommendation) {
        const actionElement = document.getElementById('recommendation-action');
        const entryElement = document.getElementById('recommendation-entry');
        const stopLossElement = document.getElementById('recommendation-stop-loss');
        const takeProfitElement = document.getElementById('recommendation-take-profit');
        const riskRewardElement = document.getElementById('recommendation-risk-reward');

        if (actionElement) {
            actionElement.textContent = recommendation.action.toUpperCase();
            actionElement.className = `recommendation-${recommendation.action}`;
        }

        if (entryElement) entryElement.textContent = recommendation.entry.toFixed(4);
        if (stopLossElement) stopLossElement.textContent = recommendation.stopLoss.toFixed(4);
        if (takeProfitElement) takeProfitElement.textContent = recommendation.takeProfit.toFixed(4);
        if (riskRewardElement) riskRewardElement.textContent = recommendation.riskReward.toFixed(2);
    }

    updateMarketConditions(conditions) {
        const volatilityElement = document.getElementById('volatility-value');
        const volumeElement = document.getElementById('volume-value');
        const spreadElement = document.getElementById('spread-value');

        if (volatilityElement) volatilityElement.textContent = `${conditions.volatility}%`;
        if (volumeElement) volumeElement.textContent = conditions.volume.toLocaleString();
        if (spreadElement) spreadElement.textContent = conditions.spread.toFixed(5);
    }

    getRSIClass(rsi) {
        if (rsi > 70) return 'rsi-overbought';
        if (rsi < 30) return 'rsi-oversold';
        return 'rsi-neutral';
    }

    toggleAutoAnalysis() {
        const autoBtn = document.getElementById('auto-analyze-btn');
        
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
            autoBtn.textContent = 'Iniciar Análise Automática';
            autoBtn.className = 'btn btn-primary';
            console.log('⏹️ Análise automática parada');
        } else {
            this.analysisInterval = setInterval(() => {
                this.performAnalysis();
            }, 30000); // A cada 30 segundos
            
            autoBtn.textContent = 'Parar Análise Automática';
            autoBtn.className = 'btn btn-danger';
            console.log('▶️ Análise automática iniciada');
        }
    }

    updateAnalyzeButton(isAnalyzing) {
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            if (isAnalyzing) {
                analyzeBtn.textContent = 'Analisando...';
                analyzeBtn.disabled = true;
            } else {
                analyzeBtn.textContent = 'Analisar';
                analyzeBtn.disabled = false;
            }
        }
    }

    showSettings() {
        // Implementar modal de configurações
        console.log('⚙️ Mostrando configurações de IA...');
        window.authManager.showToast('Info', 'Configurações de IA em desenvolvimento', 'info');
    }

    updateUI() {
        // Atualizar interface com dados atuais
        if (this.currentAnalysis) {
            this.displayAnalysis(this.currentAnalysis);
        }
    }

    // Método para executar trade baseado na análise
    async executeTradeFromAnalysis() {
        if (!this.currentAnalysis) {
            window.authManager.showToast('Erro', 'Nenhuma análise disponível', 'error');
            return;
        }

        const recommendation = this.currentAnalysis.recommendation;
        
        // Confirmar execução
        const confirmed = confirm(
            `Executar trade ${recommendation.action.toUpperCase()}?\n` +
            `Entrada: ${recommendation.entry}\n` +
            `Stop Loss: ${recommendation.stopLoss}\n` +
            `Take Profit: ${recommendation.takeProfit}`
        );

        if (confirmed) {
            try {
                const response = await fetch(getApiUrl('/api/v1/trading/execute'), {
                    method: 'POST',
                    headers: {
                        ...window.authManager.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pair: this.currentSymbol,
                        type: recommendation.action,
                        amount: 100, // Valor padrão
                        stopLoss: recommendation.stopLoss,
                        takeProfit: recommendation.takeProfit
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    window.authManager.showToast('Sucesso', 'Trade executado com sucesso!', 'success');
                    console.log('✅ Trade executado:', data);
                } else {
                    const errorData = await response.json();
                    window.authManager.showToast('Erro', errorData.message, 'error');
                }
            } catch (error) {
                console.error('❌ Erro ao executar trade:', error);
                window.authManager.showToast('Erro', 'Erro ao executar trade', 'error');
            }
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, creating AI Analysis Manager');
    window.aiAnalysisManager = new AIAnalysisManager();
});
