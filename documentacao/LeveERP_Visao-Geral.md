# Visão Geral e Produto: Leve ERP (PRISM)

## 1. O que é o Leve ERP
O Leve ERP, internamente referenciado como **PRISM** ou **Portal do TI**, é a espinha dorsal tecnológica da **Leve Mobilidade**. Trata-se de um sistema de gestão integrada planejado para centralizar o controle operacional, financeiro e administrativo de centenas de unidades de estacionamento distribuídas por todo o território nacional.

A plataforma resolve o desafio da descentralização de dados, unificando em uma interface única informações que anteriormente residiam em planilhas isoladas ou sistemas legados de terceiros. Ele permite que a sede em Recife tenha visibilidade em tempo real sobre o uptime de infraestrutura (internet), a progressão de metas de faturamento, a gestão de ativos físicos (patrimônio) e o fluxo de incidentes operacionais (sinistros).

O Leve ERP foi construído internamente para garantir total aderência aos processos específicos da Leve Mobilidade — como a integração complexa com o sistema Control-XRM e o fluxo peculiar de solicitações de tarifários — evitando as limitações de customização e os altos custos de licenciamento de softwares de prateleira que não atendiam à agilidade exigida pela operação de campo.

## 2. Público-alvo Interno
O sistema é utilizado por diversas camadas da organização, com permissões baseadas em perfis de acesso (RBAC):

*   **Administradores (Admin):** Possuem visão holística de todo o ecossistema, gerindo configurações globais, permissões de usuários e auditoria de logs técnicos.
*   **TI Interno:** Focado na manutenção da infraestrutura, monitoramento de links de internet, gestão de cotas de IA e suporte técnico via Central de Solicitações.
*   **Supervisão:** Coordenadores de campo que utilizam a plataforma para gerir suas operações específicas, reportar sinistros e acompanhar colaboradores sob sua responsabilidade.
*   **Gerência de Operações:** Perfil regional que analisa o desempenho das unidades, aprova mudanças tarifárias e monitora a saúde financeira das operações.
*   **Financeiro Comum/Específico:** Profissionais focados na conciliação de faturamento, acompanhamento de metas mensais e processamento de solicitações de compra (SC).

## 3. Módulos Existentes

### Operacional e Core
*   **Operações:** Gestão do cadastro de unidades, vinculação de supervisores, gerentes operacionais e status de atividade. (**Funcional**)
*   **Colaboradores:** Gerenciamento da equipe alocada em cada operação, permitindo o rastreio de pessoal por unidade. (**Funcional**)
*   **Sinistros:** Fluxo completo de reporte, análise e encerramento de incidentes em pátio, incluindo anexos de evidências. (**Funcional**)
*   **Tarifários:** Workflow de solicitação e aprovação para alteração de preços em unidades, garantindo rastreabilidade jurídica e comercial. (**Funcional**)

### Financeiro e Integrações
*   **Faturamento & Metas:** Dashboard de acompanhamento de metas financeiras mensais por operação, com cálculo de performance. (**Funcional**)
*   **Integração Personal:** Módulo específico para distribuição e faturamento de operações da trilha "Personal". (**Funcional**)
*   **Control-XRM Logs:** Monitoramento técnico das rotinas automáticas de sincronização com o faturamento externo. (**Funcional**)

### Suporte e Ativos
*   **Patrimônio:** Inventário detalhado de ativos físicos (TI, mobiliário, infra), com categorização inteligente e histórico de edições. (**Funcional**)
*   **Central de Solicitações:** Sistema de Helpdesk em formato wizard para abertura de chamados técnicos, administrativos e de RH. (**Funcional / Refatorado**)
*   **Links de Internet:** Monitoramento de conectividade e uptime de cada unidade conectada à rede Leve. (**Funcional**)

### Tecnologia e Estratégia
*   **Tecnologia & IA:** Hub de ferramentas de inteligência artificial, gestão de tokens, biblioteca de prompts e gerador de solicitações de compra automática. (**Em Desenvolvimento**)
*   **Auditoria / Logs:** Registro detalhado de ações críticas realizadas por usuários para conformidade e segurança. (**Funcional**)

## 4. Fluxo Macro do Sistema
O fluxo de dados no Leve ERP ocorre em três frentes principais:

1.  **Entrada Automática:** Scripts de integração (como o Control-XRM) populam o banco de dados com dados de faturamento bruto e logs técnicos durante a madrugada.
2.  **Entrada Manual de Campo:** Supervisores e gerentes inserem dados em tempo real via módulos de Sinistros e Central de Solicitações (frequentemente via dispositivos móveis).
3.  **Processamento de Inteligência:** O módulo de Metas de Faturamento cruza os dados planejados com os realizados, gerando os KPIs exibidos no Dashboard principal.

As informações fluem entre os módulos de forma interdependente: por exemplo, um sinistro pode gerar uma solicitação de manutenção na Central, que por sua vez pode exigir a baixa de um item no Patrimônio.

## 5. Estado Atual do Produto
*   **O que já está funcional:** Toda a estrutura de Dashboard, Operações, Faturamento (Metas), Sinistros, Patrimônio e Central de Solicitações está operacional e em uso.
*   **Em construção/planejado:** O gerador automático de SC (Solicitações de Compra), a expansão da biblioteca de prompts para automação de relatórios via IA e dashboards de BI avançados.
*   **Limitações Conhecidas:** A integração com alguns sistemas legados de pátio ainda depende de arquivos intermediários (CSV/JSON), e o módulo de granularidade de permissões está em fase final de refinamento para casos de uso departamentais.

## 6. Informações do Projeto
*   **Stack Tecnológica:** Next.js 14+ (App Router), TypeScript, Tailwind CSS e Supabase (PostgreSQL, Auth, Storage).
*   **Identidade Visual:** Primária: `#272F5C` (Azul-marinho), Secundária: `#DB3A2E` (Vermelho Leve). O design segue a linguagem "Antigravity", focada em interfaces espaciais, cards interativos e glassmorphism.
*   **Desenvolvimento:** Metodologia incremental gerenciada internamente, utilizando ferramentas de IA avançada (Stitch/Antigravity) para prototipagem rápida e entrega contínua.