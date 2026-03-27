# Leve ERP — Changelog Documental

> Registro de todas as mudanças na documentação do projeto.
> **Versão atual:** 3.0 | **Data:** 2026-03-26

---

## v3.0 — 2026-03-26 (Auditoria Técnica Completa)

### 🆕 ARQUIVOS CRIADOS

| Arquivo | Conteúdo |
|--|--|
| `docs/leve_erp_documentacao_master_v3_0.md` | Documento mestre consolidado — NOVA FONTE DA VERDADE |
| `docs/leve_erp_estrutura_dados.md` | Schema completo: ~40 tabelas, enums, triggers, RPCs |
| `docs/leve_erp_fluxos_regras.md` | Fluxos funcionais e regras de negócio |
| `docs/leve_erp_base_ia.md` | Contexto rápido para sessões de IA |
| `docs/leve_erp_backlog.md` | 17 itens de dívida técnica com roadmap |
| `docs/leve_erp_guia_prompts.md` | Prompts otimizados por tarefa |
| `docs/CHANGELOG_DOCUMENTAL.md` | Este arquivo |

### ➕ ITENS ADICIONADOS (não existiam na v2)

| Item | Detalhes |
|--|--|
| 11 módulos documentados | Faturamento, Metas, Alertas, Central, Tarifários, Permissões, Configurações, Auditoria Metas, Automações, etc. |
| 37 tabelas documentadas | Todas as tabelas de faturamento, alertas, metas, central, governança |
| ~29 APIs documentadas | Todos os endpoints não cobertos pela v2 |
| 13 regras de negócio | Deduplicação, consolidação, purga, SLA, campos dinâmicos, etc. |
| 11 riscos técnicos | AUTH_SECRET, RPCs sem schema, console.logs, etc. |
| 5 fluxos funcionais | Faturamento, metas/alertas, tarifários, central, importação |
| Sistema dual de auditoria | Triggers automáticos + logs manuais documentados |
| ThemeProvider | Suporte a tema claro/escuro |
| SWR + react-window | Novas tecnologias de data fetching e virtualização |
| 9 validações pendentes | Itens que exigem verificação no banco de produção |
| 17 débitos técnicos | Catalogados com ID, severidade, esforço e prioridade |

### 🔧 CORREÇÕES APLICADAS (divergências corrigidas)

| # | Correção | Detalhe |
|--|--|--|
| 1 | Escopo reduzido → expandido | De "2 módulos" para "13 módulos" |
| 2 | Fontes "Poppins" → "Outfit" | Poppins nunca existiu no projeto |
| 3 | FAQ sobre triggers | De "não há triggers" para "triggers abundantes" |
| 4 | RLS "ausente" → "implementada" | evolution_sinistros_rls_v1.sql existe |
| 5 | Storage "Google Drive extensivo" | Corrigido para "apenas sinistros e tarifários" |
| 6 | 6 APIs → ~35 APIs | Inventário completo |
| 7 | 8 telas → 20+ telas | Mapeamento completo |
| 8 | Data fetching "apenas fetch" | SWR adotado em módulos novos |
| 9 | sinistros/[id] "1200 linhas" | Atualizado para ~1800 linhas (68KB) |
| 10 | globals.css "1500 linhas" | Atualizado para 1553 linhas |
| 11 | Código de regra de alerta | QUEDA_BRUSCA_HIST → QUEDA_BRUSCA_HISTORICA |

### ⚠️ ITENS MARCADOS COMO OBSOLETOS

| Item | Arquivo Original | Motivo |
|--|--|--|
| `documentacao_mestre_leve_mobilidade.md` (v2) | Raiz do projeto | ~60% obsoleto; substituído pelo master v3.0 |
| `README.md` | Raiz do projeto | Template create-next-app (100% irrelevante) |
| Recomendações de `relatorio_rls_sinistros.md` | Raiz do projeto | Substituições de createAdminClient já aplicadas |

### 🔄 ITENS QUE EXIGEM VALIDAÇÃO MANUAL

| # | Item | Ação |
|--|--|--|
| V-001 | Enum `perfil_usuario` inclui `administrativo`? | Query no Supabase |
| V-002 | Enum `perfil_usuario` inclui `ti`? | Query no Supabase |
| V-003 | RPC `faturamento_consolidar_dia_v2` existe? | Query `pg_proc` |
| V-004 | RPC `reprocessar_metas_diarias` existe? | Query `pg_proc` |
| V-005 | Tabela `metas_faturamento_apuracoes_diarias` existe? | Table Editor |
| V-006 | Migration RLS aplicada em produção? | Testar policies |
| V-007 | AUTH_SECRET em produção é o placeholder? | Verificar variáveis |
| V-008 | deploy-hostinger.zip contém secrets? | Inspecionar ZIP |
| V-009 | Cron de alertas está configurado? | Verificar scheduler |

---

## DOCUMENTOS ANTIGOS (Legado)

Os seguintes documentos existem na raiz do projeto e estão sendo PRESERVADOS como referência histórica:

| Arquivo | Status | Ação |
|--|--|--|
| `documentacao_mestre_leve_mobilidade.md` | ⚠️ LEGADO | Mantido para referência; NÃO é mais fonte da verdade |
| `README_AUDITORIA_V2.md` | ✅ ~90% válido | Atualizado incrementalmente |
| `DOC_INTEGRACAO_CENTRAL.md` | ✅ ~95% válido | Atualizado incrementalmente |
| `documentacao_alerta_faturamento.md` | ✅ ~85% válido | Atualizado incrementalmente |
| `relatorio_rls_sinistros.md` | ⚠️ ~60% obsoleto | Recomendações já aplicadas |

---

## HIERARQUIA DE DOCUMENTOS (Daqui em diante)

```
📁 docs/                              ← FONTE OFICIAL
├── leve_erp_documentacao_master_v3_0.md   ← FONTE DA VERDADE #1
├── leve_erp_estrutura_dados.md            ← Complementar: banco
├── leve_erp_fluxos_regras.md              ← Complementar: regras
├── leve_erp_base_ia.md                    ← Complementar: IA
├── leve_erp_backlog.md                    ← Complementar: backlog
├── leve_erp_guia_prompts.md               ← Complementar: prompts
└── CHANGELOG_DOCUMENTAL.md                ← Este arquivo

📁 / (raiz — LEGADO)                  ← REFERÊNCIA HISTÓRICA
├── documentacao_mestre_leve_mobilidade.md  ← v2, obsoleto
├── README_AUDITORIA_V2.md                 ← Válido, complementar
├── DOC_INTEGRACAO_CENTRAL.md              ← Válido, complementar
├── documentacao_alerta_faturamento.md     ← Válido, complementar
└── relatorio_rls_sinistros.md             ← Parcialmente obsoleto
```
