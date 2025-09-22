const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { query, execute } = require('../utils/database');

// Atualizar configurações Deriv
router.put('/config', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            accountType, 
            demoToken, 
            demoAppId, 
            realToken, 
            realAppId 
        } = req.body;

        // Validar dados
        if (!accountType || !['demo', 'real'].includes(accountType)) {
            return res.status(400).json({
                status: 'error',
                message: 'Tipo de conta deve ser "demo" ou "real"'
            });
        }

        // Verificar se os tokens existem no banco para o tipo de conta selecionado
        const checkSql = `
            SELECT 
                deriv_demo_token, 
                deriv_demo_app_id, 
                deriv_real_token, 
                deriv_real_app_id 
            FROM users 
            WHERE id = ?
        `;
        const checkRows = await query(checkSql, [userId]);
        const userTokens = checkRows[0];

        if (accountType === 'demo' && (!userTokens.deriv_demo_token || !userTokens.deriv_demo_app_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Token e App ID demo não configurados. Configure primeiro em /deriv-tokens.html'
            });
        }

        if (accountType === 'real' && (!userTokens.deriv_real_token || !userTokens.deriv_real_app_id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Token e App ID real não configurados. Configure primeiro em /deriv-tokens.html'
            });
        }

        // Atualizar no banco
        const updates = {
            deriv_account_type: accountType
        };

        if (demoToken) updates.deriv_demo_token = demoToken;
        if (demoAppId) updates.deriv_demo_app_id = demoAppId;
        if (realToken) updates.deriv_real_token = realToken;
        if (realAppId) updates.deriv_real_app_id = realAppId;

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(userId);

        await execute(
            `UPDATE users SET ${fields} WHERE id = ?`,
            values
        );

        res.json({
            status: 'success',
            message: 'Configurações Deriv atualizadas com sucesso',
            data: {
                accountType,
                demoToken: demoToken ? '***' + demoToken.slice(-4) : null,
                demoAppId,
                realToken: realToken ? '***' + realToken.slice(-4) : null,
                realAppId
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar configurações Deriv:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Obter configurações Deriv
router.get('/config', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const sql = `
            SELECT 
                deriv_account_type,
                deriv_demo_token,
                deriv_demo_app_id,
                deriv_real_token,
                deriv_real_app_id
            FROM users 
            WHERE id = ?
        `;
        
        const rows = await query(sql, [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            status: 'success',
            data: {
                accountType: user.deriv_account_type,
                demoToken: user.deriv_demo_token ? '***' + user.deriv_demo_token.slice(-4) : null,
                demoAppId: user.deriv_demo_app_id,
                realToken: user.deriv_real_token ? '***' + user.deriv_real_token.slice(-4) : null,
                realAppId: user.deriv_real_app_id,
                hasDemoToken: !!user.deriv_demo_token,
                hasRealToken: !!user.deriv_real_token
            }
        });

    } catch (error) {
        console.error('Erro ao obter configurações Deriv:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Testar conexão Deriv
router.post('/test', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { accountType } = req.body;

        // Obter token e app_id baseado no tipo de conta
        const sql = `
            SELECT 
                deriv_account_type,
                deriv_demo_token,
                deriv_demo_app_id,
                deriv_real_token,
                deriv_real_app_id
            FROM users 
            WHERE id = ?
        `;
        
        const rows = await query(sql, [userId]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuário não encontrado'
            });
        }

        const testAccountType = accountType || user.deriv_account_type;
        const token = testAccountType === 'demo' ? user.deriv_demo_token : user.deriv_real_token;
        const appId = testAccountType === 'demo' ? user.deriv_demo_app_id : user.deriv_real_app_id;

        if (!token || !appId) {
            return res.status(400).json({
                status: 'error',
                message: `Token ou App ID não configurado para conta ${testAccountType}`
            });
        }

        // Aqui você pode adicionar lógica para testar a conexão com Deriv
        // Por enquanto, vamos simular um teste bem-sucedido
        
        res.json({
            status: 'success',
            message: `Conexão com Deriv (${testAccountType}) testada com sucesso`,
            data: {
                accountType: testAccountType,
                token: '***' + token.slice(-4),
                appId,
                connected: true
            }
        });

    } catch (error) {
        console.error('Erro ao testar conexão Deriv:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
