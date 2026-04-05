/* 
  Evolução de Banco de Dados: Categorias e Subcategorias de Patrimônio
  Data: 03/04/2026
*/

-- 1. Criação da tabela patrimonio_categorias
CREATE TABLE IF NOT EXISTS patrimonio_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criação da tabela patrimonio_subcategorias
CREATE TABLE IF NOT EXISTS patrimonio_subcategorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID NOT NULL REFERENCES patrimonio_categorias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Adição de colunas na tabela patrimonios
ALTER TABLE patrimonios 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES patrimonio_categorias(id),
ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES patrimonio_subcategorias(id);

-- 4. Triggers de atualizado_em
CREATE TRIGGER tr_patrimonio_categorias_atualizado_em 
BEFORE UPDATE ON patrimonio_categorias 
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER tr_patrimonio_subcategorias_atualizado_em 
BEFORE UPDATE ON patrimonio_subcategorias 
FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 5. Ativação de Auditoria
CALL sp_ativar_auditoria_tabela('patrimonio_categorias');
CALL sp_ativar_auditoria_tabela('patrimonio_subcategorias');

-- Comentários técnicos
COMMENT ON TABLE patrimonio_categorias IS 'Categorias principais para classificação de ativos patrimoniais';
COMMENT ON TABLE patrimonio_subcategorias IS 'Subcategorias vinculadas a categorias principais para detalhamento de ativos';
