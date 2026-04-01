-- -----------------------------------------------------------------------------
-- EVOLUÇÃO: CONSOLIDADO DE LOGS TÉCNICOS CONTROL-XRM
-- VERSÃO: 1.0 (v1)
-- DATA: 2026-04-01
-- DESCRIÇÃO: Estrutura isolada para logar eventos da integração Control-XRM,
--            sem vincular à auditoria global do sistema.
-- -----------------------------------------------------------------------------

-- Criar a tabela control_xrm_logs
CREATE TABLE IF NOT EXISTS public.control_xrm_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hora_log TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    nivel TEXT NOT NULL,           -- 'INFO', 'WARN', 'ERROR', 'DEBUG'
    etapa TEXT NOT NULL,           -- e.g., 'EXTRAÇÃO', 'TRANSFORMAÇÃO', 'CARGA', 'SINCRONIZAÇÃO'
    mensagem TEXT NOT NULL,
    arquivo_nome TEXT,             -- Nome do arquivo processado (se houver)
    arquivo_caminho TEXT,          -- Caminho completo ou S3/Storage bucket path
    quantidade_linhas INTEGER DEFAULT 0,
    status_execucao TEXT,          -- 'SUCESSO', 'FALHA', 'EM_PROCESSAMENTO'
    detalhes_json JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentários técnicos na estrutura
COMMENT ON TABLE public.control_xrm_logs IS 'Logs técnicos detalhados da integração Control-XRM (isolados da auditoria).';
COMMENT ON COLUMN public.control_xrm_logs.nivel IS 'Severidade do log: INFO (informativo), WARN (aviso), ERROR (erro crítico).';
COMMENT ON COLUMN public.control_xrm_logs.etapa IS 'Fase da integração: Extração, Transformação, Carga ou Validação.';

-- Índices de performance para relatórios e depuração rápida
CREATE INDEX IF NOT EXISTS idx_control_xrm_logs_data ON public.control_xrm_logs(data_hora_log DESC);
CREATE INDEX IF NOT EXISTS idx_control_xrm_logs_status ON public.control_xrm_logs(status_execucao);
CREATE INDEX IF NOT EXISTS idx_control_xrm_logs_nivel ON public.control_xrm_logs(nivel);

-- Configurações de acesso e segurança (RLS)
ALTER TABLE public.control_xrm_logs ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Administradores e suporte podem consultar logs
CREATE POLICY "Admins e TI podem ler control_xrm_logs" ON public.control_xrm_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND perfil IN ('administrador', 'auditoria', 'diretoria', 'ti')
        )
    );

-- Política de escrita: Apenas o sistema (via API auditada ou service_role) pode inserir
CREATE POLICY "Serviço pode inserir control_xrm_logs" ON public.control_xrm_logs
    FOR INSERT
    WITH CHECK (true); -- Permitimos inserção via API que valida a sessão do backend

-- Observação: A inserção permitida por 'true' no check assume que a API backend (Route Handler)
-- fará a filtragem de quem pode disparar o log técnico.
