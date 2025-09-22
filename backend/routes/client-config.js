const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { query } = require('../utils/database');

// Obter configurações do cliente
router.get('/config', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const sql = `
            SELECT 
                stop_win,
                stop_loss,
                martingale_enabled,
                martingale_multiplier,
                max_martingale_levels,
                trade_amount,
                ticket_quantity,
                max_daily_trades,
                risk_per_trade,
                ai_confidence_threshold,
                ai_analysis_interval,
                trading_pairs,
                trading_hours_start,
                trading_hours_end,
                auto_trading_enabled
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
                stopWin: user.stop_win || 50,
                stopLoss: user.stop_loss || 100,
                martingaleEnabled: user.martingale_enabled || false,
                martingaleMultiplier: user.martingale_multiplier || 2.0,
                maxMartingaleLevels: user.max_martingale_levels || 3,
                tradeAmount: user.trade_amount || 5,
                ticketQuantity: user.ticket_quantity || 10,
                maxDailyTrades: user.max_daily_trades || 50,
                riskPerTrade: user.risk_per_trade || 1,
                aiConfidenceThreshold: user.ai_confidence_threshold || 60,
                aiAnalysisInterval: user.ai_analysis_interval || 10,
                tradingPairs: user.trading_pairs ? JSON.parse(user.trading_pairs) : ['R_10', 'R_25', 'R_50'],
                tradingHoursStart: user.trading_hours_start || '00:00',
                tradingHoursEnd: user.trading_hours_end || '23:59',
                autoTradingEnabled: user.auto_trading_enabled || false
            }
        });

    } catch (error) {
        console.error('Erro ao obter configurações do cliente:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Atualizar configurações do cliente
router.put('/config', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            stopWin,
            stopLoss,
            martingaleEnabled,
            martingaleMultiplier,
            maxMartingaleLevels,
            tradeAmount,
            maxDailyTrades,
            riskPerTrade,
            aiConfidenceThreshold,
            aiAnalysisInterval,
            tradingPairs,
            tradingHoursStart,
            tradingHoursEnd,
            autoTradingEnabled
        } = req.body;

        // Validações
        if (stopWin && (stopWin < 0 || stopWin > 1000)) {
            return res.status(400).json({
                status: 'error',
                message: 'Stop Win deve estar entre 0 e 1000'
            });
        }

        if (stopLoss && (stopLoss < 0 || stopLoss > 1000)) {
            return res.status(400).json({
                status: 'error',
                message: 'Stop Loss deve estar entre 0 e 1000'
            });
        }

        if (martingaleMultiplier && (martingaleMultiplier < 1.1 || martingaleMultiplier > 5.0)) {
            return res.status(400).json({
                status: 'error',
                message: 'Multiplicador Martingale deve estar entre 1.1 e 5.0'
            });
        }

        if (maxMartingaleLevels && (maxMartingaleLevels < 1 || maxMartingaleLevels > 10)) {
            return res.status(400).json({
                status: 'error',
                message: 'Máximo de níveis Martingale deve estar entre 1 e 10'
            });
        }

        if (tradeAmount && (tradeAmount < 1 || tradeAmount > 1000)) {
            return res.status(400).json({
                status: 'error',
                message: 'Valor do trade deve estar entre 1 e 1000'
            });
        }

        if (aiConfidenceThreshold && (aiConfidenceThreshold < 10 || aiConfidenceThreshold > 100)) {
            return res.status(400).json({
                status: 'error',
                message: 'Limiar de confiança da IA deve estar entre 10 e 100'
            });
        }

        // Atualizar no banco
        const updates = {};
        if (stopWin !== undefined) updates.stop_win = stopWin;
        if (stopLoss !== undefined) updates.stop_loss = stopLoss;
        if (martingaleEnabled !== undefined) updates.martingale_enabled = martingaleEnabled;
        if (martingaleMultiplier !== undefined) updates.martingale_multiplier = martingaleMultiplier;
        if (maxMartingaleLevels !== undefined) updates.max_martingale_levels = maxMartingaleLevels;
        if (tradeAmount !== undefined) updates.trade_amount = tradeAmount;
        if (maxDailyTrades !== undefined) updates.max_daily_trades = maxDailyTrades;
        if (riskPerTrade !== undefined) updates.risk_per_trade = riskPerTrade;
        if (aiConfidenceThreshold !== undefined) updates.ai_confidence_threshold = aiConfidenceThreshold;
        if (aiAnalysisInterval !== undefined) updates.ai_analysis_interval = aiAnalysisInterval;
        if (tradingPairs !== undefined) updates.trading_pairs = JSON.stringify(tradingPairs);
        if (tradingHoursStart !== undefined) updates.trading_hours_start = tradingHoursStart;
        if (tradingHoursEnd !== undefined) updates.trading_hours_end = tradingHoursEnd;
        if (autoTradingEnabled !== undefined) updates.auto_trading_enabled = autoTradingEnabled;

        const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const updateValues = Object.values(updates);
        updateValues.push(userId);

        const sql = `UPDATE users SET ${updateFields} WHERE id = ?`;
        await query(sql, updateValues);

        res.json({
            status: 'success',
            message: 'Configurações atualizadas com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar configurações do cliente:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

// Resetar configurações para padrão
router.post('/reset', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const sql = `
            UPDATE users SET 
                stop_win = 50,
                stop_loss = 100,
                martingale_enabled = false,
                martingale_multiplier = 2.0,
                max_martingale_levels = 3,
                trade_amount = 5,
                max_daily_trades = 50,
                risk_per_trade = 1,
                ai_confidence_threshold = 60,
                ai_analysis_interval = 10,
                trading_pairs = '["R_10", "R_25", "R_50"]',
                trading_hours_start = '00:00',
                trading_hours_end = '23:59',
                auto_trading_enabled = false
            WHERE id = ?
        `;
        
        await query(sql, [userId]);

        res.json({
            status: 'success',
            message: 'Configurações resetadas para padrão'
        });

    } catch (error) {
        console.error('Erro ao resetar configurações:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
