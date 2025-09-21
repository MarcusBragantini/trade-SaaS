// reset-password.js
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Bragantini',
        database: 'forexai_trading'
    });

    try {
        const password = 'Mvb081521';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        console.log('Nova senha hash:', hashedPassword);
        
        const [result] = await connection.promise().execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'bragantini34@gmail.com']
        );
        
        console.log('Resultado do update:', result);
        console.log('✅ Senha resetada para: Mvb081521');
        
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
    } finally {
        connection.end();
    }
}

resetPassword();