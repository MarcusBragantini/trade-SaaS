const express = require('express');
const WebSocket = require('ws');
const User = require('../models/User');
const router = express.Router();

// Deriv API configuration
const DERIV_API_URL = process.env.DERIV_API_URL || 'wss://ws.binaryws.com/websockets/v3';
const connectionCache = new Map(); // Cache de conexões por token

// Limpar conexões antigas a cada 5 minutos
setInterval(() => {
  console.log('🧹 Limpando conexões WebSocket antigas...');
  for (const [key, ws] of connectionCache.entries()) {
    if (ws.readyState !== WebSocket.OPEN) {
      console.log(`🗑️ Removendo conexão fechada: ${key}`);
      connectionCache.delete(key);
    }
  }
  console.log(`📊 Conexões ativas: ${connectionCache.size}`);
}, 5 * 60 * 1000); // 5 minutos

// Get user's balance from Deriv API
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    if (!user.deriv_api_token) {
      // Se não tem token, usar saldo local
      console.log('⚠️ Token Deriv não configurado, usando saldo local');
      const localBalance = {
        balance: parseFloat(user.balance) || 1000.00,
        currency: 'USD',
        available: parseFloat(user.balance) || 1000.00,
        deposited: parseFloat(user.balance) || 1000.00,
        withdrawn: 0,
        profit: 0
      };

      return res.json({
        status: 'success',
        data: localBalance
      });
    }

    console.log('🔍 Buscando saldo real da Deriv para usuário:', user.id);
    console.log('🔑 Token sendo usado:', user.deriv_api_token);

    // Usar app_id padrão se não tiver um configurado
    const appId = user.deriv_app_id || process.env.DERIV_APP_ID || '1089';
    const wsUrl = `wss://ws.binaryws.com/websockets/v3?app_id=${appId}`;
    
    const balance = await new Promise((resolve, reject) => {
      // Verificar se já existe uma conexão ativa para este token
      const cacheKey = `${user.deriv_api_token}_${appId}`;
      let ws = connectionCache.get(cacheKey);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('♻️ Reutilizando conexão WebSocket existente');
        
        // Enviar solicitação de saldo diretamente
        const balanceRequest = {
          balance: 1,
          subscribe: 0
        };
        console.log('📤 Solicitando saldo via conexão existente:', balanceRequest);
        ws.send(JSON.stringify(balanceRequest));
        
        // Configurar listener temporário para esta requisição
        const tempHandler = (data) => {
          try {
            const message = JSON.parse(data);
            if (message.balance) {
              console.log('💰 Saldo recebido via conexão existente:', message.balance);
              ws.removeListener('message', tempHandler);
              
              const balanceData = {
                balance: parseFloat(message.balance.balance) || 0,
                currency: message.balance.currency || 'USD',
                available: parseFloat(message.balance.balance) || 0,
                deposited: parseFloat(message.balance.balance) || 0,
                withdrawn: 0,
                profit: 0
              };
              
              resolve(balanceData);
            }
          } catch (parseError) {
            console.error('❌ Erro ao processar mensagem:', parseError);
          }
        };
        
        ws.on('message', tempHandler);
        
        // Timeout para esta requisição específica
        setTimeout(() => {
          ws.removeListener('message', tempHandler);
          reject(new Error('Timeout na requisição de saldo (5s)'));
        }, 5000);
        
        return;
      }
      
      // Criar nova conexão se não existir
      console.log('🔌 Criando nova conexão WebSocket...');
      ws = new WebSocket(wsUrl);
      let isResolved = false;
      
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          connectionCache.delete(cacheKey);
          ws.close();
          reject(new Error('Timeout na conexão WebSocket (10s)'));
        }
      }, 10000);
      
      ws.on('open', () => {
        console.log('✅ Nova conexão WebSocket estabelecida');
        
        // Enviar autorização
        const authMessage = {
          authorize: user.deriv_api_token
        };
        console.log('📤 Enviando autorização:', authMessage);
        ws.send(JSON.stringify(authMessage));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          
          if (message.error) {
            console.error('❌ Erro da Deriv:', message.error);
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              connectionCache.delete(cacheKey);
              ws.close();
              reject(new Error(`Erro da Deriv: ${message.error.message || 'Token inválido ou expirado'}`));
            }
            return;
          }
          
          if (message.authorize) {
            console.log('✅ Autorizado na Deriv');
            
            // Solicitar saldo
            const balanceRequest = {
              balance: 1,
              subscribe: 0
            };
            console.log('📤 Solicitando saldo:', balanceRequest);
            ws.send(JSON.stringify(balanceRequest));
          }
          
          if (message.balance) {
            console.log('💰 Saldo recebido da Deriv:', message.balance);
            
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              
              // Manter conexão ativa no cache
              connectionCache.set(cacheKey, ws);
              console.log('💾 Conexão salva no cache para reutilização');
              
              const balanceData = {
                balance: parseFloat(message.balance.balance) || 0,
                currency: message.balance.currency || 'USD',
                available: parseFloat(message.balance.balance) || 0,
                deposited: parseFloat(message.balance.balance) || 0,
                withdrawn: 0,
                profit: 0
              };
              
              resolve(balanceData);
            }
          }
        } catch (parseError) {
          console.error('❌ Erro ao processar mensagem:', parseError);
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ Erro WebSocket:', error);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          connectionCache.delete(cacheKey);
          reject(new Error(`Erro de conexão: ${error.message}`));
        }
      });
      
      ws.on('close', (code, reason) => {
        console.log('🔌 Conexão WebSocket fechada:', code, reason.toString());
        connectionCache.delete(cacheKey);
      });
    });

    console.log('✅ Saldo real obtido da Deriv:', balance);

    res.json({
      status: 'success',
      data: balance
    });
  } catch (derivError) {
    console.error('❌ Erro ao buscar saldo da Deriv:', derivError.message);
    
    // Fallback para dados do banco local se a API falhar
    const user = await User.findById(req.userId);
    const localBalance = {
      balance: parseFloat(user.balance) || 1000.00,
      currency: 'USD',
      available: parseFloat(user.balance) || 1000.00,
      deposited: parseFloat(user.balance) || 1000.00,
      withdrawn: 0,
      profit: 0
    };

    console.log('⚠️ Usando saldo local como fallback:', localBalance);

    res.json({
      status: 'success',
      data: localBalance
    });
  }
});

// Execute real trade on Deriv
router.post('/execute-trade', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    if (!user.deriv_api_token) {
      return res.status(403).json({
        status: 'error',
        message: 'Token da Deriv não configurado'
      });
    }

    const { pair, type, amount, stopLoss, takeProfit } = req.body;
    
    console.log('🚀 Executando trade real na Deriv:', { pair, type, amount, user: user.id });

    // Executar trade real na Deriv via WebSocket
    const tradeResult = await executeRealTrade(user.deriv_api_token, {
      pair,
      type,
      amount,
      stopLoss,
      takeProfit
    });

    console.log('✅ Trade executado na Deriv:', tradeResult);

    res.json({
      status: 'success',
      message: 'Trade executado com sucesso na Deriv',
      data: tradeResult
    });
  } catch (error) {
    console.error('Deriv trade execution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao executar trade na Deriv'
    });
  }
});

// Função para executar trade real na Deriv
async function executeRealTrade(token, tradeParams) {
  return new Promise((resolve, reject) => {
    const { pair, type, amount, stopLoss, takeProfit } = tradeParams;
    
    // Mapear tipo para formato da Deriv
    const contractType = type.toUpperCase() === 'CALL' ? 'CALL' : 'PUT';
    
    // Conectar ao WebSocket da Deriv
    const ws = new WebSocket(DERIV_API_URL);
    
    let isResolved = false;
    
    ws.on('open', () => {
      console.log('🔌 Conectado à Deriv para execução de trade');
      
      // Autorizar
      ws.send(JSON.stringify({
        authorize: token
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        console.log('📨 Resposta da Deriv:', response);
        
        if (response.msg_type === 'authorize') {
          if (response.error) {
            console.error('❌ Erro de autorização:', response.error);
            if (!isResolved) {
              isResolved = true;
              reject(new Error(`Erro de autorização: ${response.error.message}`));
            }
            return;
          }
          
          console.log('✅ Autorizado na Deriv');
          
          // Solicitar proposta de contrato
          ws.send(JSON.stringify({
            proposal: 1,
            amount: amount,
            basis: 'stake',
            contract_type: contractType,
            currency: 'USD',
            duration: 5, // 5 minutos
            duration_unit: 'm',
            symbol: pair
          }));
        }
        
        if (response.msg_type === 'proposal') {
          if (response.error) {
            console.error('❌ Erro na proposta:', response.error);
            if (!isResolved) {
              isResolved = true;
              reject(new Error(`Erro na proposta: ${response.error.message}`));
            }
            return;
          }
          
          console.log('💰 Proposta recebida:', response.proposal);
          
          // Comprar o contrato
          ws.send(JSON.stringify({
            buy: response.proposal.id,
            price: response.proposal.ask_price
          }));
        }
        
        if (response.msg_type === 'buy') {
          if (response.error) {
            console.error('❌ Erro na compra:', response.error);
            if (!isResolved) {
              isResolved = true;
              reject(new Error(`Erro na compra: ${response.error.message}`));
            }
            return;
          }
          
          console.log('✅ Contrato comprado:', response.buy);
          
          const tradeResult = {
            id: response.buy.contract_id,
            pair: pair,
            type: type,
            amount: amount,
            status: 'executed',
            timestamp: new Date(),
            contractId: response.buy.contract_id,
            realTrade: true,
            stopLoss: stopLoss,
            takeProfit: takeProfit
          };
          
          if (!isResolved) {
            isResolved = true;
            resolve(tradeResult);
          }
          
          ws.close();
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar resposta:', error);
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
      if (error.message.includes('401')) {
        console.error('🔑 Token da Deriv expirado ou inválido');
        if (!isResolved) {
          isResolved = true;
          reject(new Error('Token da Deriv expirado ou inválido. Por favor, configure um novo token.'));
        }
      } else {
        if (!isResolved) {
          isResolved = true;
          reject(error);
        }
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 Conexão WebSocket fechada');
    });
    
    // Timeout de 30 segundos
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        ws.close();
        reject(new Error('Timeout na execução do trade'));
      }
    }, 30000);
  });
}

module.exports = router;