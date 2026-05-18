-- V3__seed_admin.sql
-- Insere o usuário administrador padrão se não existir

INSERT INTO funcionario (nome, cargo, senha)
SELECT 'Administrador do Sistema', 'ADMIN', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE NOT EXISTS (SELECT 1 FROM funcionario WHERE cargo = 'ADMIN');