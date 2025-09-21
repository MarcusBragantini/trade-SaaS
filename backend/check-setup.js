const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração do ForexAI Trading System...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env não encontrado.');
  console.log('📋 Criando arquivo .env a partir de .env.example...');
  
  const envExamplePath = path.join(__dirname, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Arquivo .env criado. Por favor, configure as variáveis de ambiente.');
  } else {
    console.log('❌ Arquivo .env.example não encontrado.');
    process.exit(1);
  }
} else {
  console.log('✅ Arquivo .env encontrado.');
}

// Check node version
const nodeVersion = process.version;
const requiredVersion = '16.0.0';
if (parseFloat(nodeVersion.slice(1)) < parseFloat(requiredVersion)) {
  console.log(`❌ Versão do Node.js (${nodeVersion}) é inferior à requerida (${requiredVersion}+)`);
  process.exit(1);
} else {
  console.log(`✅ Versão do Node.js: ${nodeVersion}`);
}

// Check if dependencies are installed
try {
  const packageJson = require('./package.json');
  console.log('✅ package.json carregado.');
} catch (error) {
  console.log('❌ Erro ao carregar package.json:', error.message);
  process.exit(1);
}

// Check if MySQL is available
console.log('\n📊 Verificando configuração MySQL...');
try {
  const mysql = require('mysql2/promise');
  console.log('✅ MySQL2 package disponível.');
} catch (error) {
  console.log('❌ MySQL2 package não disponível. Execute: npm install mysql2');
  process.exit(1);
}

console.log('\n✅ Verificação de configuração concluída.');
console.log('\n📝 Próximos passos:');
console.log('1. Configure as variáveis no arquivo .env (especialmente MySQL)');
console.log('2. Execute "npm install" para instalar as dependências');
console.log('3. Execute "npm run init-db" para inicializar o banco de dados');
console.log('4. Execute "npm run dev" para iniciar o servidor\n');