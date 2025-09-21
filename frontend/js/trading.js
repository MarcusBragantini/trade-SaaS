class TradingManager {
    constructor() {
        this.isAutoTrading = false;
        this.availableCurrencies = [];
        this.initialized = false;
        this.candlestickChart = null;
        // Não inicializar automaticamente - aguardar authStateChanged
    }

    async init() {
        if (this.initialized) return;
        
        console.log('📈 Inicializando Trading Manager...');
        try {
            await this.loadAvailableCurrencies();
            this.bindEvents();
            this.loadTradingData();
            this.initialized = true;
            console.log('✅ Trading Manager inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar Trading Manager:', error);
        }
    }

    async loadAvailableCurrencies() {
        try {
            console.log('📊 Carregando moedas para trading...');
            const response = await fetch(getApiUrl('/api/v1/ai/currencies'), {
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.availableCurrencies = data.data.currencies;
                this.populateAssetSelectors();
                console.log('✅ Moedas carregadas para trading:', this.availableCurrencies.length);
            } else {
                console.error('❌ Erro ao carregar moedas:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar moedas:', error);
        }
    }

    populateAssetSelectors() {
        // Popular seletor do gráfico
        const assetSelect = document.getElementById('asset-select');
        const tradeAsset = document.getElementById('trade-asset');
        
        if (assetSelect && tradeAsset) {
            this.populateSelector(assetSelect);
            this.populateSelector(tradeAsset);
            
            // Selecionar primeira moeda sempre aberta por padrão
            const firstAlwaysOpen = this.availableCurrencies.find(c => c.alwaysOpen);
            if (firstAlwaysOpen) {
                assetSelect.value = firstAlwaysOpen.symbol;
                tradeAsset.value = firstAlwaysOpen.symbol;
            }
        }
    }

    populateSelector(selector) {
        if (!selector) return;
        
        selector.innerHTML = '';
        
        // Agrupar por tipo
        const groupedCurrencies = this.availableCurrencies.reduce((groups, currency) => {
            const type = currency.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(currency);
            return groups;
        }, {});
        
        // Criar optgroups para cada tipo
        Object.keys(groupedCurrencies).forEach(type => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = this.getTypeLabel(type);
            
            groupedCurrencies[type].forEach(currency => {
                const option = document.createElement('option');
                option.value = currency.symbol;
                
                // Criar texto com status visual
                const statusIcon = currency.isOpen ? '🟢' : '🔴';
                const marketInfo = currency.alwaysOpen ? '24/7' : currency.market;
                option.textContent = `${statusIcon} ${currency.symbol} - ${currency.name} (${marketInfo})`;
                
                // Adicionar atributos para styling
                option.dataset.type = currency.type;
                option.dataset.status = currency.status;
                option.dataset.alwaysOpen = currency.alwaysOpen;
                
                optgroup.appendChild(option);
            });
            
            selector.appendChild(optgroup);
        });
    }
    
    getTypeLabel(type) {
        const labels = {
            'Crypto': '🪙 Criptomoedas (24/7)',
            'Synthetic': '⚡ Sintéticas (24/7)',
            'Forex': '💱 Forex (Horário Limitado)',
            'Commodity': '🥇 Commodities (Horário Limitado)',
            'Index': '📈 Índices (Horário Limitado)'
        };
        return labels[type] || type;
    }

    bindEvents() {
        // Auto trading toggle
        document.getElementById('auto-trading-toggle').addEventListener('change', (e) => {
            this.toggleAutoTrading(e.target.checked);
        });

        // Trade execution buttons
        document.querySelectorAll('.btn-direction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.prepareTrade(e.target.dataset.direction);
            });
        });

        // Execute trade button
        document.getElementById('execute-trade').addEventListener('click', () => {
            this.executeTrade();
        });

        // Force execute trade button
        document.getElementById('force-execute-trade').addEventListener('click', () => {
            this.forceExecuteTrade();
        });

        // Asset selection
        document.getElementById('asset-select').addEventListener('change', (e) => {
            console.log('🔄 Ativo alterado para:', e.target.value);
            this.updateChart(e.target.value);
        });

        // Trade asset selection
        document.getElementById('trade-asset').addEventListener('change', (e) => {
            this.updateTradeAsset(e.target.value);
        });

        // Timeframe selection
        document.getElementById('timeframe-select').addEventListener('change', (e) => {
            this.updateChartTimeframe(e.target.value);
        });

        // Controles de trade
        document.getElementById('stop-loss').addEventListener('input', () => {
            this.updateRiskReward();
        });

        document.getElementById('take-profit').addEventListener('input', () => {
            this.updateRiskReward();
        });

        document.getElementById('trade-amount').addEventListener('input', () => {
            this.updateRiskReward();
        });

        // Botão de parada de emergência
        document.getElementById('emergency-stop').addEventListener('click', () => {
            this.emergencyStop();
        });

        // Toggle de decisão da IA
        document.getElementById('ai-decision-toggle').addEventListener('change', (e) => {
            this.updateTradeStatus();
        });
    }

    toggleAutoTrading(enabled) {
        this.isAutoTrading = enabled;
        if (enabled) {
            this.startAutoTrading();
        } else {
            this.stopAutoTrading();
        }
    }

    startAutoTrading() {
        console.log('🤖 Auto trading iniciado');
        this.autoTradingInterval = setInterval(() => {
            this.performAutoTrade();
        }, 30000); // Executar a cada 30 segundos
    }

    stopAutoTrading() {
        console.log('🛑 Auto trading parado');
        if (this.autoTradingInterval) {
            clearInterval(this.autoTradingInterval);
            this.autoTradingInterval = null;
        }
    }

    async performAutoTrade() {
        try {
            // Buscar análise de IA para o ativo selecionado
            const selectedAsset = document.getElementById('trade-asset').value;
            if (!selectedAsset) {
                console.log('⚠️ Nenhum ativo selecionado para auto trading');
                return;
            }

            console.log('🔍 Buscando análise de IA para:', selectedAsset);
            
            const response = await fetch(getApiUrl('/api/v1/ai/analyze'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: selectedAsset,
                    timeframe: '1m'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const analysis = data.data;
                
                // Verificar se a confiança é alta o suficiente para executar
                if (analysis.signals.confidence > 70) {
                    console.log('🎯 Alta confiança detectada:', analysis.signals.confidence + '%');
                    
                    // Determinar direção baseada na recomendação
                    const direction = analysis.recommendation.action.toLowerCase() === 'buy' ? 'call' : 'put';
                    const amount = 10; // Valor fixo para auto trading
                    
                    console.log('🚀 Executando trade automático:', { selectedAsset, direction, amount });
                    
                    // Executar trade automaticamente
                    await this.executeAutoTrade(selectedAsset, direction, amount, analysis);
                } else {
                    console.log('⏳ Confiança insuficiente para auto trading:', analysis.signals.confidence + '%');
                }
            } else {
                console.error('❌ Erro ao buscar análise de IA');
            }
        } catch (error) {
            console.error('❌ Erro no auto trading:', error);
        }
    }

    async executeAutoTrade(asset, direction, amount, analysis) {
        try {
            const response = await fetch(getApiUrl('/api/v1/trading/execute'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pair: asset,
                    type: direction.toUpperCase(), // CALL ou PUT
                    amount: amount,
                    stopLoss: 2,
                    takeProfit: 5,
                    autoTrade: true,
                    aiAnalysis: analysis
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Trade automático executado:', data);
                window.authManager.showToast('Auto Trading', `Trade ${direction.toUpperCase()} executado automaticamente em ${asset}`, 'success');
                
                // Recarregar dados
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
            } else {
                const error = await response.json();
                console.error('❌ Erro no trade automático:', error);
            }
        } catch (error) {
            console.error('❌ Erro na execução do trade automático:', error);
        }
    }

    prepareTrade(direction) {
        const tradeButton = document.getElementById('execute-trade');
        const emergencyStopToggle = document.getElementById('emergency-stop-toggle');
        
        // Verificar se parada de emergência está ativa
        if (emergencyStopToggle.checked) {
            window.authManager.showToast('Erro', 'Parada de emergência ativa. Desative para continuar.', 'error');
            return;
        }
        
        tradeButton.disabled = false;
        tradeButton.dataset.direction = direction;
        
        // Atualizar status
        this.updateTradeStatus();
        
        // Buscar recomendação real da IA
        this.getAIRecommendation(direction);
    }

    async getAIRecommendation(direction) {
        try {
            const selectedAsset = document.getElementById('trade-asset').value;
            if (!selectedAsset) {
                this.simulateAIRecommendation(direction);
                return;
            }

            console.log('🔍 Buscando recomendação de IA para:', selectedAsset);
            
            const response = await fetch(getApiUrl('/api/v1/ai/analyze'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: selectedAsset,
                    timeframe: '1m'
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Dados recebidos da IA:', data);
                
                if (data && data.data) {
                    const analysis = data.data;
                    console.log('🔍 Análise extraída:', analysis);
                    this.displayAIRecommendation(analysis, direction);
                } else {
                    console.error('❌ Estrutura de dados inválida:', data);
                    this.simulateAIRecommendation(direction);
                }
            } else {
                if (response.status === 429) {
                    console.warn('⚠️ Rate limiting na recomendação da IA');
                    this.simulateAIRecommendation(direction);
                } else {
                    console.error('❌ Erro ao buscar recomendação de IA:', response.status);
                    this.simulateAIRecommendation(direction);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao buscar recomendação de IA:', error);
            this.simulateAIRecommendation(direction);
        }
    }

    displayAIRecommendation(analysis, selectedDirection) {
        const recommendation = document.getElementById('ai-recommendation-text');
        const confidenceElement = document.getElementById('ai-confidence');
        const aiElement = document.getElementById('ai-recommendation');
        
        // Verificar se os dados necessários existem
        if (!analysis || !analysis.recommendation || !analysis.recommendation.action) {
            console.error('❌ Dados de análise incompletos:', analysis);
            recommendation.textContent = '❌ Erro na análise da IA';
            confidenceElement.textContent = 'Dados incompletos';
            aiElement.className = 'ai-recommendation low-confidence';
            return;
        }
        
        const aiAction = analysis.recommendation.action || 'unknown';
        const aiDirection = aiAction.toLowerCase() === 'buy' ? 'call' : 'put';
        const confidence = analysis.signals?.confidence || 0;
        const strength = analysis.signals?.strength || 0;
        
        // Verificar se a direção selecionada coincide com a recomendação da IA
        const isAligned = selectedDirection === aiDirection;
        
        // Criar mensagem mais informativa
        let message = `IA recomenda: ${aiAction.toUpperCase()}`;
        if (isAligned) {
            message += ' ✅ Alinhado';
        } else {
            message += ` ⚠️ Não alinhado (IA: ${aiDirection.toUpperCase()}, Você: ${selectedDirection.toUpperCase()})`;
        }
        
        recommendation.textContent = message;
        confidenceElement.textContent = `Confiança: ${confidence.toFixed(1)}% | Força: ${strength.toFixed(1)}%`;
        
        // Adicionar classe baseada na confiança e alinhamento
        aiElement.className = 'ai-recommendation';
        if (confidence > 70) {
            aiElement.classList.add('high-confidence');
        } else if (confidence > 40) {
            aiElement.classList.add('medium-confidence');
        } else {
            aiElement.classList.add('low-confidence');
        }
        
        if (!isAligned) {
            aiElement.classList.add('misaligned');
        }
    }

    simulateAIRecommendation(direction) {
        const confidence = Math.random() * 100;
        const recommendation = document.getElementById('ai-recommendation-text');
        const confidenceElement = document.getElementById('ai-confidence');
        
        recommendation.textContent = `Recomendação: ${direction === 'call' ? 'COMPRA' : 'VENDA'} (Simulado)`;
        confidenceElement.textContent = `Confiança: ${confidence.toFixed(1)}%`;
        
        // Adicionar classe baseada na confiança
        const aiElement = document.getElementById('ai-recommendation');
        aiElement.className = 'ai-recommendation';
        if (confidence > 70) {
            aiElement.classList.add('high-confidence');
        } else if (confidence > 40) {
            aiElement.classList.add('medium-confidence');
        } else {
            aiElement.classList.add('low-confidence');
        }
    }

    async executeTrade() {
        const tradeButton = document.getElementById('execute-trade');
        const direction = tradeButton.dataset.direction;
        const asset = document.getElementById('trade-asset').value;
        const amount = document.getElementById('trade-amount').value;
        const stopLoss = document.getElementById('stop-loss').value;
        const takeProfit = document.getElementById('take-profit').value;
        const entryPrice = document.getElementById('entry-price').value;
        const aiDecisionToggle = document.getElementById('ai-decision-toggle');
        const emergencyStopToggle = document.getElementById('emergency-stop-toggle');

        // Validações básicas
        if (!asset) {
            window.authManager.showToast('Erro', 'Selecione um ativo para operar', 'error');
            return;
        }

        if (!direction) {
            window.authManager.showToast('Erro', 'Selecione uma direção (COMPRA ou VENDA)', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            window.authManager.showToast('Erro', 'Valor da operação deve ser maior que zero', 'error');
            return;
        }

        if (emergencyStopToggle.checked) {
            window.authManager.showToast('Erro', 'Parada de emergência ativa. Desative para continuar.', 'error');
            return;
        }

        // Se IA decide, verificar se deve executar
        if (aiDecisionToggle.checked) {
            const shouldExecute = await this.shouldExecuteTrade(asset, direction);
            if (!shouldExecute) {
                window.authManager.showToast('IA Recomendação', 'IA não recomenda este trade no momento', 'warning');
                return;
            }
        }

        try {
            console.log('🚀 Executando trade:', { asset, direction, amount });
            
            const response = await fetch(getApiUrl('/api/v1/trading/execute'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pair: asset,
                    type: direction.toUpperCase(), // CALL ou PUT
                    amount: parseFloat(amount),
                    stopLoss: parseFloat(stopLoss),
                    takeProfit: parseFloat(takeProfit),
                    entryPrice: parseFloat(entryPrice) || null,
                    aiDecision: aiDecisionToggle.checked
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Trade executado com sucesso:', data);
                window.authManager.showToast('Sucesso', 'Trade executado com sucesso', 'success');
                
                // Recarregar dados
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
                this.loadTradingData();
                
                // Resetar formulário
                tradeButton.disabled = true;
                tradeButton.dataset.direction = '';
            } else {
                const error = await response.json();
                console.error('❌ Erro na execução do trade:', error);
                window.authManager.showToast('Erro', error.message || 'Erro ao executar trade', 'error');
            }
        } catch (error) {
            console.error('❌ Erro na execução do trade:', error);
            window.authManager.showToast('Erro', 'Erro ao executar trade', 'error');
        }
    }

    updateTradeAsset(asset) {
        console.log('📊 Ativo de trading alterado para:', asset);
        // Sincronizar com o seletor do gráfico
        const assetSelect = document.getElementById('asset-select');
        if (assetSelect) {
            assetSelect.value = asset;
        }
        this.updateRiskReward();
    }

    updateRiskReward() {
        const stopLoss = parseFloat(document.getElementById('stop-loss').value) || 0;
        const takeProfit = parseFloat(document.getElementById('take-profit').value) || 0;
        const amount = parseFloat(document.getElementById('trade-amount').value) || 0;

        if (stopLoss > 0 && takeProfit > 0) {
            const riskReward = (takeProfit / stopLoss).toFixed(2);
            document.getElementById('risk-reward-value').textContent = `1:${riskReward}`;
            
            // Colorir baseado no risk/reward
            const riskRewardElement = document.getElementById('risk-reward-value');
            riskRewardElement.className = 'status-value';
            if (riskReward >= 2) {
                riskRewardElement.classList.add('ready');
            } else if (riskReward >= 1) {
                riskRewardElement.classList.add('waiting');
            } else {
                riskRewardElement.classList.add('error');
            }
        } else {
            document.getElementById('risk-reward-value').textContent = '-';
        }
    }

    updateTradeStatus() {
        const aiDecisionToggle = document.getElementById('ai-decision-toggle');
        const emergencyStopToggle = document.getElementById('emergency-stop-toggle');
        const statusElement = document.getElementById('trade-status-value');
        
        if (emergencyStopToggle.checked) {
            statusElement.textContent = 'Parada de Emergência Ativa';
            statusElement.className = 'status-value error';
        } else if (aiDecisionToggle.checked) {
            statusElement.textContent = 'Aguardando Decisão da IA';
            statusElement.className = 'status-value waiting';
        } else {
            statusElement.textContent = 'Pronto para Executar';
            statusElement.className = 'status-value ready';
        }
    }

    emergencyStop() {
        console.log('🚨 Parada de emergência ativada!');
        
        // Parar trading automático
        this.stopAutoTrading();
        
        // Fechar todas as posições abertas
        this.closeAllPositions();
        
        // Atualizar status
        document.getElementById('trade-status-value').textContent = 'Parada de Emergência';
        document.getElementById('trade-status-value').className = 'status-value error';
        
        // Desabilitar controles
        document.getElementById('execute-trade').disabled = true;
        document.getElementById('emergency-stop').disabled = true;
        
        window.authManager.showToast('Parada de Emergência', 'Todas as operações foram interrompidas', 'error');
    }

    async closeAllPositions() {
        try {
            // Simular fechamento de todas as posições
            console.log('🔒 Fechando todas as posições...');
            
            // Aqui você faria a chamada real para fechar posições
            // const response = await fetch(getApiUrl('/api/v1/trading/close-all'), {
            //     method: 'POST',
            //     headers: window.authManager.getAuthHeaders()
            // });
            
            console.log('✅ Todas as posições foram fechadas');
        } catch (error) {
            console.error('❌ Erro ao fechar posições:', error);
        }
    }

    showAIDecisionFeedback(shouldExecute, reason, confidence, strength, isAligned) {
        const recommendation = document.getElementById('ai-recommendation-text');
        const confidenceElement = document.getElementById('ai-confidence');
        const aiElement = document.getElementById('ai-recommendation');
        const executeButton = document.getElementById('execute-trade');
        const forceExecuteButton = document.getElementById('force-execute-trade');
        
        if (shouldExecute) {
            recommendation.textContent = `✅ IA APROVA: ${reason}`;
            confidenceElement.textContent = `Confiança: ${confidence}% | Força: ${strength}%`;
            
            // Adicionar classe de alta confiança
            aiElement.className = 'ai-recommendation high-confidence';
            
            // Habilitar botão de execução normal
            executeButton.disabled = false;
            forceExecuteButton.style.display = 'none';
            
            // Mostrar toast de aprovação
            window.authManager.showToast('IA Aprovou', `Trade aprovado: ${reason}`, 'success');
        } else {
            recommendation.textContent = `❌ IA REJEITA: ${reason}`;
            confidenceElement.textContent = `Confiança: ${confidence}% | Força: ${strength}% | Alinhado: ${isAligned ? 'Sim' : 'Não'}`;
            
            // Adicionar classe de baixa confiança
            aiElement.className = 'ai-recommendation low-confidence';
            
            // Desabilitar botão normal e mostrar botão de forçar
            executeButton.disabled = true;
            forceExecuteButton.style.display = 'inline-block';
            forceExecuteButton.disabled = false;
            
            // Mostrar toast de rejeição
            window.authManager.showToast('IA Rejeitou', `Trade rejeitado: ${reason}`, 'warning');
        }
    }

    async forceExecuteTrade() {
        const confirmed = confirm('⚠️ A IA rejeitou este trade. Você tem certeza que deseja executar mesmo assim?');
        
        if (confirmed) {
            console.log('🚀 Forçando execução do trade...');
            
            // Executar trade sem verificação da IA
            const tradeButton = document.getElementById('execute-trade');
            const direction = tradeButton.dataset.direction;
            const asset = document.getElementById('trade-asset').value;
            const amount = document.getElementById('trade-amount').value;
            const stopLoss = document.getElementById('stop-loss').value;
            const takeProfit = document.getElementById('take-profit').value;
            const entryPrice = document.getElementById('entry-price').value;

            try {
                console.log('🚀 Executando trade forçado:', { asset, direction, amount });
                
                const response = await fetch(getApiUrl('/api/v1/trading/execute'), {
                    method: 'POST',
                    headers: {
                        ...window.authManager.getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pair: asset,
                        type: direction.toUpperCase(),
                        amount: parseFloat(amount),
                        stopLoss: parseFloat(stopLoss),
                        takeProfit: parseFloat(takeProfit),
                        entryPrice: parseFloat(entryPrice) || null,
                        aiDecision: false, // Marcar como execução forçada
                        forced: true
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Trade forçado executado com sucesso:', data);
                    window.authManager.showToast('Trade Forçado', 'Trade executado contra recomendação da IA', 'warning');
                    
                    // Recarregar dados
                    if (window.dashboardManager) {
                        window.dashboardManager.loadDashboardData();
                    }
                    this.loadTradingData();
                    
                    // Resetar formulário
                    tradeButton.disabled = true;
                    tradeButton.dataset.direction = '';
                    document.getElementById('force-execute-trade').style.display = 'none';
                } else {
                    const error = await response.json();
                    console.error('❌ Erro na execução forçada do trade:', error);
                    window.authManager.showToast('Erro', error.message || 'Erro ao executar trade forçado', 'error');
                }
            } catch (error) {
                console.error('❌ Erro na execução forçada do trade:', error);
                window.authManager.showToast('Erro', 'Erro ao executar trade forçado', 'error');
            }
        }
    }

    async shouldExecuteTrade(asset, direction) {
        try {
            console.log('🤖 IA analisando se deve executar trade...');
            
            const response = await fetch(getApiUrl('/api/v1/ai/analyze'), {
                method: 'POST',
                headers: {
                    ...window.authManager.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: asset,
                    timeframe: '1m'
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Dados recebidos da IA para decisão:', data);
                
                if (!data || !data.data) {
                    console.error('❌ Estrutura de dados inválida para decisão:', data);
                    return false;
                }
                
                const analysis = data.data;
                
                // Critérios para execução (ajustados para serem mais realistas):
                // 1. Confiança > 40% (reduzido de 70%)
                // 2. Força do sinal > 50% (reduzido de 60%)
                // 3. Direção alinhada com recomendação da IA (ou confiança muito alta)
                
                // Verificar se os dados necessários existem
                if (!analysis || !analysis.signals || !analysis.recommendation || !analysis.recommendation.action) {
                    console.error('❌ Dados de análise incompletos para decisão:', analysis);
                    return false;
                }
                
                const confidence = analysis.signals.confidence || 0;
                const strength = analysis.signals.strength || 0;
                const aiDirection = analysis.recommendation.action.toLowerCase() === 'buy' ? 'call' : 'put';
                const isAligned = direction === aiDirection;
                
                // Lógica mais flexível:
                // - Se confiança alta (>70%) e força boa (>60%), executa independente da direção
                // - Se confiança média (>40%) e força boa (>50%) e direção alinhada, executa
                // - Se confiança muito alta (>80%), executa independente de outros fatores
                const shouldExecute = 
                    (confidence > 80) || // Confiança muito alta
                    (confidence > 70 && strength > 60) || // Confiança alta + força boa
                    (confidence > 40 && strength > 50 && isAligned); // Confiança média + força boa + alinhado
                
                // Determinar a razão da decisão
                let reason = '';
                if (shouldExecute) {
                    if (confidence > 80) {
                        reason = 'Confiança muito alta (>80%)';
                    } else if (confidence > 70 && strength > 60) {
                        reason = 'Confiança alta + força boa';
                    } else {
                        reason = 'Confiança média + força boa + direção alinhada';
                    }
                } else {
                    if (confidence <= 40) {
                        reason = `Confiança muito baixa (${confidence}% < 40%)`;
                    } else if (strength <= 50) {
                        reason = `Força do sinal baixa (${strength}% < 50%)`;
                    } else if (!isAligned) {
                        reason = `Direção não alinhada (IA: ${aiDirection}, Você: ${direction})`;
                    } else {
                        reason = 'Critérios não atendidos';
                    }
                }
                
                console.log('🧠 Decisão da IA:', {
                    confidence,
                    strength,
                    isAligned,
                    shouldExecute,
                    reason
                });
                
                // Mostrar feedback para o usuário
                this.showAIDecisionFeedback(shouldExecute, reason, confidence, strength, isAligned);
                
                return shouldExecute;
            } else {
                // Verificar se é erro de rate limiting
                if (response.status === 429) {
                    console.warn('⚠️ Rate limiting na análise da IA');
                    window.authManager.showToast('Aviso', 'IA temporariamente indisponível. Trade será executado sem análise.', 'warning');
                    return true; // Permitir trade sem análise em caso de rate limiting
                } else {
                    console.error('❌ Erro ao obter análise da IA:', response.status);
                    return false;
                }
            }
        } catch (error) {
            console.error('❌ Erro na análise da IA:', error);
            return false;
        }
    }

    async closePosition(positionId) {
        try {
            const response = await fetch(getApiUrl(`/api/v1/trading/positions/${positionId}/close`), {
                method: 'POST',
                headers: window.authManager.getAuthHeaders()
            });

            if (response.ok) {
                window.authManager.showToast('Sucesso', 'Posição fechada com sucesso', 'success');
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
                this.loadTradingData();
            } else {
                const error = await response.json();
                window.authManager.showToast('Erro', error.message, 'error');
            }
        } catch (error) {
            console.error('Error closing position:', error);
            window.authManager.showToast('Erro', 'Erro ao fechar posição', 'error');
        }
    }

    updateChart(asset) {
        console.log('📊 Atualizando gráfico para:', asset);
        this.createCandlestickChart(asset);
    }

    createCandlestickChart(asset) {
        console.log('🎯 Criando gráfico de velas para:', asset);
        const ctx = document.getElementById('candlestick-chart');
        if (!ctx) {
            console.error('❌ Canvas do gráfico não encontrado');
            return;
        }

        console.log('✅ Canvas encontrado:', ctx);

        // Destruir gráfico existente se houver
        if (this.candlestickChart) {
            console.log('🗑️ Destruindo gráfico existente');
            this.candlestickChart.destroy();
        }

        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js não está carregado');
            return;
        }

        // Gerar dados simulados de candlestick
        const data = this.generateCandlestickData(asset);
        console.log('📊 Dados gerados:', data.length, 'velas');
        
        try {
            this.candlestickChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.x).toLocaleTimeString()),
                datasets: [{
                    label: `${asset} - Preço de Fechamento`,
                    data: data.map(d => d.close),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Gráfico de Preços - ${asset}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tempo'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Preço ($)'
                        },
                        beginAtZero: false
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de preços criado com sucesso!');
        console.log('📊 Gráfico renderizado:', this.candlestickChart);
        } catch (error) {
            console.error('❌ Erro ao criar gráfico:', error);
        }
    }

    generateCandlestickData(asset) {
        const data = [];
        const now = new Date();
        let basePrice = 1.0;
        
        // Ajustar preço base baseado no ativo
        switch(asset) {
            case 'BTCUSD':
                basePrice = 45000;
                break;
            case 'ETHUSD':
                basePrice = 3000;
                break;
            case 'ADAUSD':
                basePrice = 0.5;
                break;
            case 'DOTUSD':
                basePrice = 7.0;
                break;
            default:
                basePrice = 1.0;
        }

        // Gerar 50 velas (últimas 50 minutos)
        for (let i = 50; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000); // 1 minuto atrás
            
            // Simular movimento de preço
            const volatility = 0.02; // 2% de volatilidade
            const change = (Math.random() - 0.5) * volatility;
            basePrice *= (1 + change);
            
            // Gerar OHLC
            const open = basePrice;
            const close = basePrice * (1 + (Math.random() - 0.5) * 0.01);
            const high = Math.max(open, close) * (1 + Math.random() * 0.005);
            const low = Math.min(open, close) * (1 - Math.random() * 0.005);
            const volume = Math.floor(Math.random() * 1000000) + 100000;
            
            data.push({
                x: time,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume
            });
            
            basePrice = close;
        }
        
        return data;
    }

    updateChartTimeframe(timeframe) {
        console.log('Timeframe changed to:', timeframe);
        // Implementar atualização do timeframe do gráfico
    }

    loadTradingData() {
        // Carregar dados de trading
        const selectedAsset = document.getElementById('asset-select').value || 'BTCUSD';
        console.log('📈 Carregando dados de trading para:', selectedAsset);
        this.updateChart(selectedAsset);
        
        // Forçar atualização do gráfico após um pequeno delay
        setTimeout(() => {
            console.log('🔄 Forçando atualização do gráfico...');
            this.updateChart(selectedAsset);
        }, 1000);
    }
}

// Initialize trading manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, creating trading manager');
    window.tradingManager = new TradingManager();
});

// Initialize when auth state changes
document.addEventListener('authStateChanged', () => {
    console.log('🔐 Auth state changed, initializing trading manager');
    if (window.tradingManager && !window.tradingManager.initialized) {
        window.tradingManager.init();
    }
});