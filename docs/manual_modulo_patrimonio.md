# 📦 Manual do Módulo de Patrimônio — Leve ERP
> **Versão 1.0** — Guia Completo de Operação, Governança e Auditoria de Ativos.

Este documento tem como objetivo orientar usuários e administradores no uso do novo **Módulo de Patrimônio**, projetado para oferecer visibilidade total, controle de custos e rastreabilidade de ativos em toda a rede Leve.

---

## 🧭 1. Visão Geral e Navegação

O módulo de Patrimônio está localizado na **Sidebar Principal** sob a seção **Módulos Operacionais**. Ele foi desenvolvido com uma interface de alta densidade para permitir a gestão de centrais de ativos complexas com o mínimo de esforço.

### Acessos Rápidos:
- **Dashboard Central:** `/admin/patrimonio`
- **Novo Cadastro:** `/admin/patrimonio/novo`
- **Central de Alertas:** `/admin/patrimonio/alertas`

---

## 📊 2. Dashboard de Gestão (Visão Consolidada)

O Dashboard é o coração do módulo. Ele utiliza o conceito de **Density UI** para apresentar o máximo de informações úteis sem necessidade de rolagem excessiva.

### 2.1 Indicadores de Performance (KPIs)
No topo da página, quatro mini-cards apresentam o estado atual da rede:
- **Total de Ativos:** Quantidade bruta de itens catalogados.
- **Em Uso:** Ativos alocados a operações ou usuários (Status: *Ativo*).
- **Em Manutençao:** Itens em reparo técnico ou preventivo.
- **Valor Patrimonial:** Soma dos valores de aquisição (Patrimônio Líquido).

### 2.2 Inventário e Filtros
A tabela central permite localizar ativos rapidamente através de:
- **Busca Global:** Pesquisa por ID (Tag), Nome ou Unidade de alocação.
- **Filtro de Status:** Filtra por *Estoque, Ativo, Manutenção, Baixado* ou *Extraviado*.
- **Filtro de Categoria:** Separa itens por *TI, Facilities, Veículos, Mobiliário*, etc.

---

## 📝 3. Cadastro de Novos Ativos

O formulário de cadastro foi desenhado seguindo o padrão **Premium Soft**, focando na precisão dos dados.

### 3.1 Etapas do Cadastro:
1. **Identificação:** Insira o **Código/Tag ID** (etiqueta física) e o **Nome Comercial**.
2. **Categoria:** Selecione o tipo de ativo para acionar regras de depreciação futura.
3. **Alocação:** Defina a **Unidade (Operação)** atual e, se aplicável, o **Usuário Responsável** (posse individual).
4. **Financeiro:** Informe o valor de compra e as datas de aquisição e fim de garantia para monitoramento automático.

> [!IMPORTANT]
> Ativos de uso individual (Laptops, Celulares) **devem** ser vinculados a um usuário responsável para fins de termo de responsabilidade.

---

## 🔍 4. Detalhes e Gestão 360

A página de detalhes (`/admin/patrimonio/[id]`) oferece uma visão completa do ciclo de vida de um ativo através de um sistema de abas:

- **Aba Geral:** Dados técnicos, descrição e status financeiro.
- **Aba Histórico (Timeline):** Log de auditoria de quem criou, quem moveu e quando o status foi alterado.
- **Aba Manutenções:** Registro de reparos realizados e agendamentos futuros.
- **Aba Anexos:** Upload de Notas Fiscais (XML/PDF), fotos do estado do item e manuais.

---

## ⚠️ 5. Central de Alertas

O sistema monitora o patrimônio e gera notificações automáticas para:
- **Garantia Vencendo:** Alerta 30 dias antes do fim da garantia de fábrica.
- **Manutenção Pendente:** Itens marcados como "Em Manutenção" há mais de 7 dias.
- **Itens Extraviados:** Notificação imediata para auditoria em caso de perda reportada.

---

## 🔐 6. Perfis e Permissões

O acesso ao módulo é segmentado para garantir a segurança dos dados:

| Perfil | Visualização | Edição/Cadastro | Baixa de Ativos |
| :--- | :---: | :---: | :---: |
| **Administrador** | ✅ | ✅ | ✅ |
| **Diretoria** | ✅ | ✅ | ❌ |
| **Financeiro** | ✅ | ✅ (Financeiro) | ❌ |
| **Auditoria** | ✅ | ❌ | ❌ |
| **TI / Administrativo**| ✅ | ✅ | ❌ |

---

## ⚙️ 7. Referência Técnica (Padrão Desenvolvedor)

### Estrutura de Banco de Dados
O módulo utiliza as seguintes tabelas integradas:
- `patrimonio`: Tabela mestre de ativos.
- `patrimonio_movimentacoes`: Log de histórico e posse.
- `patrimonio_manutencoes`: Registro de intervenções técnicas.
- `patrimonio_vistorias`: Checklists de estado periódico.
- `patrimonio_alertas`: Gatilhos de monitoramento.

### APIs Principais
- `GET /api/patrimonio`: Lista todos os ativos com filtros aplicados.
- `POST /api/patrimonio`: Cria um novo registro com auditoria automática.
- `PATCH /api/patrimonio/alertas`: Resolve pendências de monitoramento.

---

## ❓ 8. Perguntas Frequentes (FAQ)

**P: Como mudo um item de uma operação para outra?**
R: Na página de detalhes do ativo, utilize a ação rápida "Nova Transferência" para registrar a movimentação no histórico.

**P: Posso excluir um patrimônio cadastrado errado?**
R: Por questões de auditoria, patrimônios não são excluídos. Caso o cadastro esteja incorreto, altere o status para "Baixado" e justifique nas observações.

**P: Onde anexo a Nota Fiscal?**
R: Na aba "Anexos" dentro da página de detalhes do ativo específico.

---
*Documentação gerada automaticamente pela Antigravity AI em 02/04/2026.*
