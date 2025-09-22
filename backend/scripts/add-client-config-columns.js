const mysql = require('mysql2/promise');
require('dotenv').config();

async function addClientConfigColumns() {
    let connection;
    
    try {
        // Conectar ao banco de dados
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'forexai_saas'
        });

        console.log('🔄 Conectado ao banco de dados...');

        // Lista de colunas para adicionar
        const columns = [
            {
                name: 'stop_win',
                definition: 'DECIMAL(10,2) DEFAULT 50 COMMENT "Stop Win em USD"'
            },
            {
                name: 'stop_loss',
                definition: 'DECIMAL(10,2) DEFAULT 100 COMMENT "Stop Loss em USD"'
            },
            {
                name: 'martingale_enabled',
                definition: 'BOOLEAN DEFAULT FALSE COMMENT "Habilitar Martingale"'
            },
            {
                name: 'martingale_multiplier',
                definition: 'DECIMAL(3,2) DEFAULT 2.00 COMMENT "Multiplicador Martingale"'
            },
            {
                name: 'max_martingale_levels',
                definition: 'INT DEFAULT 3 COMMENT "Máximo de níveis Martingale"'
            },
            {
                name: 'trade_amount',
                definition: 'DECIMAL(10,2) DEFAULT 5.00 COMMENT "Valor padrão do trade"'
            },
            {
                name: 'max_daily_trades',
                definition: 'INT DEFAULT 50 COMMENT "Máximo de trades por dia"'
            },
            {
                name: 'risk_per_trade',
                definition: 'DECIMAL(5,2) DEFAULT 1.00 COMMENT "Risco por trade em %"'
            },
            {
                name: 'ai_confidence_threshold',
                definition: 'INT DEFAULT 60 COMMENT "Limiar de confiança da IA"'
            },
            {
                name: 'ai_analysis_interval',
                definition: 'INT DEFAULT 10 COMMENT "Intervalo de análise da IA em segundos"'
            },
            {
                name: 'trading_pairs',
                definition: 'TEXT COMMENT "Pares de trading ativos"'
            },
            {
                name: 'trading_hours_start',
                definition: 'TIME DEFAULT "00:00:00" COMMENT "Horário de início do trading"'
            },
            {
                name: 'trading_hours_end',
                definition: 'TIME DEFAULT "23:59:59" COMMENT "Horário de fim do trading"'
            },
            {
                name: 'auto_trading_enabled',
                definition: 'BOOLEAN DEFAULT FALSE COMMENT "Trading automático habilitado"'
            }
        ];

        // Verificar se as colunas já existem e adicionar se necessário
        for (const column of columns) {
            try {
                // Verificar se a coluna já existe
                const [rows] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = ? 
                    AND TABLE_NAME = 'users' 
                    AND COLUMN_NAME = ?
                `, [process.env.DB_NAME || 'forexai_saas', column.name]);

                if (rows.length === 0) {
                    // Adicionar a coluna
                    await connection.execute(`
                        ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}
                    `);
                    console.log(`✅ Coluna ${column.name} adicionada com sucesso`);
                } else {
                    console.log(`⚠️ Coluna ${column.name} já existe`);
                }
            } catch (error) {
                console.error(`❌ Erro ao adicionar coluna ${column.name}:`, error.message);
            }
        }

        // Inicializar valores padrão para usuários existentes
        console.log('🔄 Inicializando valores padrão...');
        
        await connection.execute(`
            UPDATE users SET 
                stop_win = 50,
                stop_loss = 100,
                martingale_enabled = FALSE,
                martingale_multiplier = 2.00,
                max_martingale_levels = 3,
                trade_amount = 5.00,
                max_daily_trades = 50,
                risk_per_trade = 1.00,
                ai_confidence_threshold = 60,
                ai_analysis_interval = 10,
                trading_pairs = '["R_10", "R_25", "R_50"]',
                trading_hours_start = '00:00:00',
                trading_hours_end = '23:59:59',
                auto_trading_enabled = FALSE
            WHERE stop_win IS NULL
        `);

        console.log('✅ Valores padrão inicializados');

        console.log('🎉 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Executar a migração
addClientConfigColumns();

