-- V2__add_em_atendimento_status.sql
-- Atualiza o CHECK constraint da coluna status para aceitar EM_ATENDIMENTO

ALTER TABLE consulta DROP CONSTRAINT IF EXISTS consulta_status_check;

ALTER TABLE consulta ADD CONSTRAINT consulta_status_check
CHECK (status IN ('AGUARDANDO', 'EM_ATENDIMENTO', 'CONCLUIDO'));