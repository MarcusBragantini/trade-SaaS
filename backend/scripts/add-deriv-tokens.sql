-- Adicionar campos para tokens demo e real da Deriv
ALTER TABLE users 
ADD COLUMN deriv_demo_token VARCHAR(255) NULL,
ADD COLUMN deriv_demo_app_id VARCHAR(50) NULL,
ADD COLUMN deriv_real_token VARCHAR(255) NULL,
ADD COLUMN deriv_real_app_id VARCHAR(50) NULL,
ADD COLUMN deriv_account_type ENUM('demo', 'real') DEFAULT 'demo';

-- Migrar dados existentes
UPDATE users 
SET 
    deriv_demo_token = deriv_api_token,
    deriv_demo_app_id = deriv_app_id,
    deriv_account_type = 'demo'
WHERE deriv_api_token IS NOT NULL;

-- Adicionar comentários
ALTER TABLE users 
MODIFY COLUMN deriv_demo_token VARCHAR(255) NULL COMMENT 'Token da conta demo da Deriv',
MODIFY COLUMN deriv_demo_app_id VARCHAR(50) NULL COMMENT 'App ID da conta demo da Deriv',
MODIFY COLUMN deriv_real_token VARCHAR(255) NULL COMMENT 'Token da conta real da Deriv',
MODIFY COLUMN deriv_real_app_id VARCHAR(50) NULL COMMENT 'App ID da conta real da Deriv',
MODIFY COLUMN deriv_account_type ENUM('demo', 'real') DEFAULT 'demo' COMMENT 'Tipo de conta Deriv ativa';
