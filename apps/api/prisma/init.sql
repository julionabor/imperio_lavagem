-- Cria a base de dados de testes se não existir.
-- Executado pelo docker-compose na inicialização.
SELECT 'CREATE DATABASE pm_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pm_test')\gexec
