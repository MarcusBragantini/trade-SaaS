// test-bcrypt.js
const bcrypt = require('bcryptjs');

async function testBcrypt() {
    try {
        const password = 'Mvb081521';
        console.log('Testando senha:', password);
        
        const hash = await bcrypt.hash(password, 12);
        console.log('Hash gerado:', hash);
        
        const isValid = await bcrypt.compare(password, hash);
        console.log('Validação com mesma senha:', isValid);
        
        const isWrongValid = await bcrypt.compare('senhaerrada', hash);
        console.log('Validação com senha errada:', isWrongValid);
        
    } catch (error) {
        console.error('Erro no bcrypt:', error);
    }
}

testBcrypt();