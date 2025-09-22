const { initializeDatabase, execute } = require('../utils/database');

async function migrateDerivTokens() {
    try {
        console.log('🔄 Inicializando banco de dados...');
        await initializeDatabase();
        
        console.log('🔄 Adicionando campos para tokens demo e real...');
        await execute(`
            ALTER TABLE users 
            ADD COLUMN deriv_demo_token VARCHAR(255) NULL,
            ADD COLUMN deriv_demo_app_id VARCHAR(50) NULL,
            ADD COLUMN deriv_real_token VARCHAR(255) NULL,
            ADD COLUMN deriv_real_app_id VARCHAR(50) NULL,
            ADD COLUMN deriv_account_type ENUM('demo', 'real') DEFAULT 'demo'
        `);
        
        console.log('🔄 Migrando dados existentes...');
        await execute(`
            UPDATE users 
            SET 
                deriv_demo_token = deriv_api_token,
                deriv_demo_app_id = deriv_app_id,
                deriv_account_type = 'demo'
            WHERE deriv_api_token IS NOT NULL
        `);
        
        console.log('✅ Migração concluída com sucesso!');
        console.log('📊 Novos campos adicionados:');
        console.log('   - deriv_demo_token');
        console.log('   - deriv_demo_app_id');
        console.log('   - deriv_real_token');
        console.log('   - deriv_real_app_id');
        console.log('   - deriv_account_type');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
        if (error.message.includes('Duplicate column name')) {
            console.log('ℹ️ Campos já existem, migração não necessária.');
        }
    }
}

migrateDerivTokens();
