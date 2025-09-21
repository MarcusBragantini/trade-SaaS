// fix-passwords.js
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Bragantini',
        database: 'forexai_trading'
    });

    try {
        // Lista de usuários e suas senhas
        const users = [
            { email: 'bragantini34@gmail.com', password: 'Mvb081521' },
            { email: 'admin@forexai.com', password: 'admin123' },
            { email: 'demo@forexai.com', password: 'demo123' },
            { email: 'joao@teste.com', password: 'senha123' },
            { email: 'joao@gmail.com', password: 'senha123' }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            
            await connection.promise().execute(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, user.email]
            );
            
            console.log(`✅ Senha resetada para ${user.email}`);
        }

        console.log('\n🎉 Todas as senhas foram corrigidas!');
        
    } catch (error) {
        console.error('Erro ao corrigir senhas:', error);
    } finally {
        connection.end();
    }
}

fixPasswords();