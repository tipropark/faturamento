# Design System: Leve ERP (PRISM)

---

## 1. Identidade Visual

### Paleta de Cores

#### Brand Colors
| Token CSS | Valor Hex | Descrição |
|---|---|---|
| `--brand-primary` | `#000080` | Azul-marinho principal — botões, links ativos, ícones, headers |
| `--brand-primary-light` | `#E9ECF8` | Background de elementos primários (badges, icons wrappers) |
| `--brand-primary-dark` | `#000050` | Hover/Active de elementos primários |
| `--brand-secondary` | `#DB3A2E` | Vermelho Leve — usado em alertas, danger e identidade de marca |
| `--brand-accent` | `#000080` | Corresponde à primária; usado em foco de inputs |

> **Convenção:** O azul-marinho `#000080` é a cor preferida para interação, enquanto o vermelho `#DB3A2E` é reservado para ações destrutivas, alertas críticos e acentos de marca.

#### Gradientes Premium
```css
--premium-gradient:       linear-gradient(135deg, #000050 0%, #000080 100%);
--premium-gradient-hover: linear-gradient(135deg, #000040 0%, #000060 100%);
--danger-gradient:        linear-gradient(135deg, #991B1B 0%, #EF4444 100%);
--success-gradient:       linear-gradient(135deg, #065F46 0%, #10B981 100%);
--warning-gradient:       linear-gradient(135deg, #92400E 0%, #F59E0B 100%);
```

#### Escala de Neutros (Slate)
| Token | Valor | Uso |
|---|---|---|
| `--gray-50` | `#F8FAFC` | Background de tabelas (thead), alertas suaves |
| `--gray-100` | `#F1F5F9` | Background app (`--bg-app` light) |
| `--gray-200` | `#E2E8F0` | Bordas, separadores (`--border-color` light) |
| `--gray-300` | `#CBD5E1` | Placeholders de divisão |
| `--gray-400` | `#94A3B8` | Texto desabilitado, labels secundárias |
| `--gray-500` | `#64748B` | Labels uppercase de stat cards |
| `--gray-600` | `#475569` | Texto corrido de tabelas |
| `--gray-700` | `#334155` | Texto body padrão (`body color`) |
| `--gray-800` | `#1E293B` | Texto médio-alto contraste |
| `--gray-900` | `#0F172A` | Títulos, valores de KPI, headings |

#### Cores de Estado (Semânticas)
| Estado | Token | Background | Texto Escuro |
|---|---|---|---|
| Sucesso | `--success: #10B981` | `--success-bg: #D1FAE5` | `--success-dark: #065F46` |
| Alerta | `--warning: #F59E0B` | `--warning-bg: #FEF3C7` | `--warning-dark: #92400E` |
| Perigo | `--danger: #EF4444` | `--danger-bg: #FEE2E2` | `--danger-dark: #991B1B` |
| Info | `--info: #000080` | `--info-bg: #DBEAFE` | `--info-dark: #000080` |

### Dark Mode — Overrides

Ativado ao adicionar classe `.dark` no `<html>`. Overrides via CSS custom properties:

```css
.dark {
  --bg-app:      #0B0E14;  /* Fundo do app */
  --bg-card:     #151921;  /* Fundo dos cards */
  --border-color: #232933;
  --gray-50:     #10141D;
  --gray-100:    #1A1F2B;
  --gray-200:    #232933;
  --gray-300:    #303947;
  --gray-700:    #C4D0E1;  /* Texto body invertido */
  --gray-800:    #E2E8F0;
  --gray-900:    #F8FAFC;  /* Títulos invertidos */
  --shadow:      0 8px 24px rgba(0, 0, 0, 0.3);
}
```

> A sidebar (`--bg-sidebar: #0F172A`) permanece escura em ambos os modos — ela é sempre dark-themed.

---

## 2. Tipografia

### Famílias de Fonte

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
```

| Família | Uso | Pesos |
|---|---|---|
| **Inter** | Corpo de texto, tabelas, formulários, inputs, labels | 400, 500, 600, 700, 800 |
| **Outfit** | Headings (`h1–h6`), logo "LEVE ERP", stat values, títulos de cards | 400, 500, 600, 700, 800, 900 |

**Regra base no `body`:**
```css
font-family: 'Inter', system-ui, sans-serif;
font-size: 0.9375rem;  /* 15px */
line-height: 1.5;
color: var(--gray-700);
-webkit-font-smoothing: antialiased;
```

**Regra para headings:**
```css
h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  line-height: 1.25;
}
```

### Escala Tipográfica

| Token | Rem | px | Uso típico |
|---|---|---|---|
| `--fs-xs` | `0.75rem` | 12px | Badge labels, stat labels (uppercase) |
| `--fs-sm` | `0.8125rem` | 13px | Form labels (uppercase), textos auxiliares |
| `--fs-base` | `0.9375rem` | 15px | Body text, table cells |
| `--fs-md` | `1rem` | 16px | Tab labels |
| `--fs-lg` | `1.125rem` | 18px | Card titles, section headers |
| `--fs-xl` | `1.25rem` | 20px | Page subtitles, modal títulos secundários |
| `--fs-2xl` | `1.5rem` | 24px | Modal titles, page section major |
| `--fs-3xl` | `2rem` | 32px | Page titles (`h1`) |

### KPI / Stat Values
Valores numéricos grandes usam Outfit em peso 900 com `letter-spacing: -0.04em` para compactação visual premium:
```css
.stat-value {
  font-size: 1.75rem;    /* 28px */
  font-weight: 900;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.04em;
  line-height: 1;
}
```

---

## 3. Espaçamento e Grid

### Sistema de Raios (Border Radius)
| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | `4px` | Tags compactas |
| `--radius-sm` | `8px` | Botões pequenos, badges |
| `--radius` | `12px` | Botões padrão, inputs, `.btn` |
| `--radius-md` | `16px` | Cards padrão, modais, `.card` |
| `--radius-lg` | `24px` | Cards de KPI (`.stat-card: border-radius: 20px`), forms premium |
| `--radius-full` | `9999px` | Badges pill, avatares |

### Sombras
```css
--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
--shadow:    0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
--shadow-md: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.08);
--shadow-lg: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
```

### Breakpoints (Mobile-First)
| Breakpoint | Largura | Comportamento |
|---|---|---|
| Mobile | `≤ 480px` | Botões full-width, stat values menores |
| Tablet | `≤ 768px` | Sidebar e Topbar ocultadas; BottomNav ativado; `stats-grid` → 1 coluna |
| Laptop | `≤ 1024px` | `stats-grid` → 2 colunas; sidebar: 260px |
| Desktop | `≤ 1280px` | `stats-grid` → 2 colunas |
| Wide | `> 1280px` | Layout completo, sidebar 280px, `stats-grid` → 4 colunas |

### Layout de Página Interna
```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (fixed) │  TOPBAR (full width)          │
│  280px expanded  ├───────────────────────────────│
│  84px collapsed  │  PAGE BODY                    │
│                  │  padding-left: sidebar-width  │
│                  │  padding: 1.25rem             │
│                  │  max-width: 100%              │
└─────────────────────────────────────────────────┘
```

- **Desktop:** `padding-left = var(--sidebar-width) + 1.25rem`
- **Mobile:** Sidebar oculta, BottomNav presente, `padding-bottom: ~100px`

---

## 4. Componentes Documentados

### Topbar (`src/components/Topbar.tsx`)
- **Propósito:** Barra superior fixa exibindo breadcrumb do módulo ativo e ações globais.
- **Visibilidade:** Oculta em mobile (`display: none` em `≤768px`) — substituída pelo BottomNav.
- **Conteúdo:** Nome do sistema no lado esquerdo + título da rota atual; lado direito: avatar do usuário com nome e perfil.
- **Alturas:** `height: 64px`; fundo `var(--bg-card)`; borda inferior `var(--border-color)`.

---

### Menu Lateral — Sidebar (`src/components/Sidebar.tsx`)

| Estado | Largura | Comportamento |
|---|---|---|
| Expandido (pinado) | `280px` | Ícone + Label visíveis |
| Colapsado (pinado) | `84px` | Apenas ícone; label oculta |
| Hover sobre colapsado | `280px` (overlay) | Expande sobre o conteúdo com `z-index: 101` e sombra lateral |

- **Background:** `#0F172A` (always dark, independente do tema global).
- **Glassmorphism:** `backdrop-filter: blur(45px) saturate(180%)`.
- **Animação de colapso:** `transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Item ativo:** Border-left colorida + background com opacidade de `var(--brand-primary)`.
- **Rodapé:** Avatar do usuário (iniciais em round), nome, perfil label e botão de logout.
- **Mobile:** Retirado do DOM com `display: none`; substituído por drawer ativado pelo BottomNav.

---

### Cards de Métricas — KPI Stats (`.stat-card`)

```css
.stat-card {
  background: var(--bg-card);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.08);
  border-color: var(--brand-primary-light);
}
```

**Anatomia interna:**
```
┌─────────────────────────────┐
│ [Icon Wrapper 44×44px]      │
│ LABEL UPPERCASE (0.7rem)    │
│ 1.234.567                   │  ← stat-value (Outfit 900, 1.75rem)
│ ─────────────────────────── │
│ Footer text (gray-400)      │
└─────────────────────────────┘
```

**Grid padrão:**
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 3.5rem;
}
```

---

### Tabelas (`.table`)

```css
.table th {
  padding: 1.25rem 1.5rem;
  background: var(--gray-50);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--gray-500);
  letter-spacing: 0.1em;
}
.table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.9375rem;
  color: var(--gray-700);
}
.table tr.cursor-pointer:hover {
  background: var(--gray-50);
  cursor: pointer;
}
```

- **Container:** `.table-responsive` com `overflow-x: auto`, `border-radius: var(--radius-md)`.
- **Estado vazio:** `.table-empty` com `padding: 4rem 2rem`, centralizado, cor `gray-400`.
- **Virtualização:** Listas longas (>500 linhas) usam `react-window` via `VirtualMetasTable` e `VirtualTicketsTable`.

---

### Botões (`.btn`)

| Variante | Classe CSS | Aparência | Uso |
|---|---|---|---|
| Primary | `.btn-primary` | Gradiente `#000050 → #000080`, shadow azul | Ação principal da página |
| Secondary | `.btn-secondary` | Fundo azul translúcido, borda azul suave | Ações secundárias |
| Outline | `.btn-outline` | Transparent + borda `brand-primary` | Alternância / modo selecionado |
| Ghost | `.btn-ghost` | Fundo branco 5% opacidade, borda transparente | Ações terciárias, ícones na sidebar |
| Danger | `.btn-danger` | Gradiente `#991B1B → #EF4444`, shadow vermelho | Excluir, revogar |
| Success | `.btn-success` | Gradiente success | Aprovar, confirmar verde |
| Warning | `.btn-warning` | Gradiente warning | Ação com atenção |

**Tamanhos:**
| Modificador | Altura | Uso |
|---|---|---|
| `.btn-xs` | `28px` | Ações inline em tabelas |
| `.btn-sm` | `36px` | Ações de filtro, toolbar secundária |
| _(padrão)_ | `44px` | Ações de formulário, modais |
| `.btn-lg` | `52px` | CTA principal |
| `.btn-icon` | `44×44px` (quadrado) | Toolbar, ações de ícone sem label |

**Micro-animação universal:** Todos os botões têm um shine animado (`::after`) que passa da esquerda para a direita no hover.

---

### Inputs e Formulários

**Standard Form:**
```css
.form-label {
  font-size: 0.8125rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.025em;
  color: var(--gray-700);
}
.form-control {
  height: 48px; padding: 0 1rem;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius); /* 12px */
}
.form-control:focus {
  border-color: var(--brand-accent);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

**Premium Form (formulários de criação):**
```css
.input-premium {
  height: 52px; padding: 0 1.25rem 0 3rem;
  background: var(--gray-50); border: 1px solid transparent;
  border-radius: 14px; font-weight: 600;
}
.input-premium:focus {
  background: #fff; border-color: var(--brand-primary);
  box-shadow: 0 0 0 4px rgba(0, 0, 128, 0.05);
  transform: translateY(-1px);
}
```

- **Label obrigatório:** `.form-label.required::after { content: " *"; color: var(--danger); }`
- **Erro:** `.form-error` em `var(--danger)`, `0.75rem`, `font-weight: 600`
- **Textarea premium:** `min-height: 120px`, `line-height: 1.6`
- **Grids de formulário:** `.form-grid-2` (2 col), `.form-grid-3` (3 col), `.form-grid-4` (4 col), com `.span-2`, `.span-3` para campos mais largos.

---

### Badges e Status Tags (`.badge`)

```css
.badge {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);  /* pill */
  font-size: 0.6875rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em;
}
```

| Classe | Background | Texto | Uso |
|---|---|---|---|
| `.badge-success` / `.badge-green` | `#D1FAE5` | `#065F46` | Status ativo, concluído, aprovado |
| `.badge-danger` / `.badge-red` | `#FEE2E2` | `#991B1B` | Erro, reprovado, inativo, crítico |
| `.badge-warning` / `.badge-yellow` | `#FEF3C7` | `#92400E` | Em análise, risco, pendente |
| `.badge-info` / `.badge-blue` | `#DBEAFE` | `#000080` | Em atendimento, informação |
| `.badge-primary` / `.badge-indigo` | `#E9ECF8` | `#000080` | Destaque de categoria, perfil |
| `.badge-gray` | `#F1F5F9` | `#475569` | Cancelado, inativo, neutro |
| `.badge-outline` | Transparente + borda `currentColor` | — | Variante outline |

> **Dot indicator:** `.badge-dot` é um círculo de `6px` na cor `currentColor` antes do texto.

---

### Modal / Dialog (`.modal-overlay` + `.modal-content`)

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}
.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-md);  /* 16px */
  box-shadow: var(--shadow-lg);
  max-width: 600px; max-height: 95vh;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Variantes de tamanho:**
| Classe | `max-width` | Uso |
|---|---|---|
| `.modal-sm` | `450px` | Confirmações simples |
| _(padrão)_ | `600px` | Formulários de criação/edição |
| `.modal-lg` | `1000px` | Formulários extensos |
| `.modal-xl` | `1400px` | `AlertaTratativaModal`, dashboards full |

**Estrutura interna:**
- `.modal-header` — `padding: 1.75rem 2.5rem`, background branco, título em Outfit 800 `1.5rem`
- `.modal-body` — `padding: 2.5rem`, `overflow-y: auto`
- `.modal-footer` — `padding: 1.75rem 2.5rem`, background `gray-50`, botões alinhados à direita

---

### Alerts / Banners (`.alert`)

```css
.alert {
  display: flex; align-items: flex-start; gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius);
  border: 1px solid transparent;
  font-size: 0.875rem;
}
```

| Classe | Background | Borda | Uso |
|---|---|---|---|
| `.alert-success` | `#D1FAE5` | `#A7F3D0` | Operação concluída |
| `.alert-error` | `#FEE2E2` | `#FECACA` | Falha, erro de campo |
| `.alert-warning` | `#FEF3C7` | `#FDE68A` | Atenção, dados sensíveis |
| `.alert-info` | `#DBEAFE` | `#BFDBFE` | Informação adicional |

---

### Tabs (`.tabs-container` + `.tab-item`)

```css
.tabs-container {
  display: flex; gap: 3rem;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 2.5rem;
}
.tab-item {
  padding: 1.25rem 0.25rem;
  font-size: 1rem; font-weight: 700;
  border-bottom: 3px solid transparent;
  color: var(--gray-400);
  position: relative; bottom: -2px; /* sobrepõe a border do container */
}
.tab-item.active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}
```

---

### Avatar / Usuário

- **Sidebar footer:** Círculo de `40×40px`, `border-radius: 12px`, background `var(--brand-primary)`, iniciais do nome em branco (Outfit 800, 0.9rem).
- **Cálculo de iniciais:**
```typescript
function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
```
- **Topbar avatar:** Versão sem texto; apenas iniciais como ícone de usuário.

---

### Loading / Skeleton
```css
.page-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 1rem; height: 60vh; color: var(--gray-400);
}
.loading-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid var(--gray-200);
  border-top-color: var(--brand-primary);
  animation: spin 0.8s linear infinite;
}
```

---

## 5. Padrões de Navegação

### Estrutura de Página Autenticada

```
[Sidebar — fixed, left] + [Main Content — flex 1]
                              ↳ [Topbar — sticky top, full width]
                              ↳ [Page Body — padding ajustado]
                                    ↳ .page-header (título + actions)
                                    ↳ .stats-grid (KPI cards)
                                    ↳ .card (tabelas, formulários)
```

### Menu Lateral — Comportamento de Colapso

```
Usuário clica "Recolher" →
  isCollapsed = true → width: 84px
  Labels desaparecem (fadeOut)
  Ícones permanecem centralizados

Hover sobre sidebar colapsada →
  width: 280px (overlay sobre conteúdo)
  z-index: 101, shadow lateral
  Labels reaparecem (fadeIn 0.2s)

Mobile (≤768px) →
  Sidebar: display none
  BottomNav: visível no rodapé
  Botão hamburger na topbar mobile abre drawer
```

### Dark / Light Mode — Implementação

O tema é gerenciado pelo `ThemeContext`:

```typescript
// Persistência em localStorage
const savedTheme = localStorage.getItem('theme');
document.documentElement.classList.toggle('dark', theme === 'dark');
```

- **Ativação:** Adiciona/remove classe `.dark` no `<html>` — CSS variables de `:root.dark` sobrescrevem os tokens.
- **Alternância:** `toggleTheme()` troca entre `'light'` e `'dark'`.
- **Configuração:** Seletor visual em `/admin/configuracoes` → tab "Aparência" com preview de mockup de tela.
- **Persistência:** Salvo no `localStorage` com chave `'theme'`.

---

## 6. Padrões de Dashboard

### Grid de KPIs
- **4 colunas** em tela larga (`>1280px`), **2 colunas** em tablet, **1 coluna** em mobile.
- Cada card tem altura fixa de **160px** com `justify-content: space-between`.
- Ícone no topo com wrapper de `44×44px`, `border-radius: 12px`, background `var(--brand-primary-light)`.
- Label em `UPPERCASE`, `0.7rem`, `font-weight: 800`, `letter-spacing: 0.06em`.
- Valor em Outfit 900, `1.75rem`, `letter-spacing: -0.04em`.
- Footer com contexto (comparativo ou badge de tendência).

### Organização das Páginas de Dashboard

Ordem padronizada das seções:
1. `.page-header` — Título H1 + Subtitle + Botões de ação
2. `.stats-grid` — KPI cards (4 max por linha)
3. `.card` — Tabela principal ou formulário
4. Cards adicionais de suporte (gráficos, listas laterais)

### Gráficos

- **Biblioteca:** [Recharts](https://recharts.org/) — integrado nativamente com React.
- **Tipos usados:**
  - `LineChart` — Evolução diária de faturamento vs. meta vs. projeção (módulo de Metas).
  - `BarChart` — Comparativos por operação.
  - `AreaChart` — Tendências de período.
- **Cores de série:** Primária `#000080`, secundária `#DB3A2E`, auxiliares: `#10B981` (sucesso), `#F59E0B` (alerta).
- **Tooltip:** Sempre presente, formatado com `R$ X.XXX,XX` para valores financeiros.

---

## 7. Ícones e Ilustrações

### Biblioteca de Ícones
- **Lucide React** — única biblioteca de ícones utilizada no projeto.
- **Instalação:** `lucide-react` via npm.
- **Importação:** Named imports — `import { LayoutDashboard, Building2, AlertTriangle } from 'lucide-react'`.

### Tamanhos Padrão

| Contexto | Tamanho (`size` prop) |
|---|---|
| Sidebar — item de menu | `18px` |
| Stat card icon (wrapper 44px) | `20–22px` |
| Botão com texto | `16px` |
| Botão icon-only | `18px` |
| Modal header | `24px` |
| Page header | `28–32px` |
| Inline em texto | `14px` |
| Alert / Badge | `14–16px` |

### Logo LEVE ERP
Ícone customizado em SVG inline (hexágono com triângulo interno):
```html
<svg width="24" height="24" viewBox="0 0 100 100" fill="none">
  <path d="M50 5L90 25V75L50 95L10 75V25L50 5Z" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round"/>
  <path d="M50 5L90 75L10 75L50 5Z" fill="#FFFFFF" fillOpacity="0.3"/>
</svg>
```
Exibido no topo da Sidebar expandida junto ao texto "LEVE ERP" em Outfit 900, `1.25rem`.

---

## 8. Seção de Títulos de Página

### `.page-header`
```css
.page-header {
  display: flex; align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2.5rem; gap: 1.5rem; flex-wrap: wrap;
}
.page-title {
  font-size: 1.875rem; font-weight: 900;
  color: var(--gray-900); letter-spacing: -0.03em;
  font-family: 'Outfit', sans-serif; line-height: 1.1;
}
.page-subtitle {
  font-size: 0.9375rem; color: var(--gray-500);
  font-weight: 500; margin-top: 0.5rem;
}
```

### Seção de Formulário com bordinha lateral
```css
.form-section-title {
  font-size: 1.125rem; font-weight: 700;
  border-left: 4px solid var(--brand-primary);
  padding-left: 1rem;
  display: flex; align-items: center; gap: 0.75rem;
}
```

---

## 9. Transições e Animações

| Nome | Definição | Uso |
|---|---|---|
| `var(--transition)` | `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` | Hover padrão de botões, inputs |
| `fadeIn` | `opacity: 0 → 1` | Entrada de overlay, labels expandidas |
| `slideUp` | `translateY(20px) opacity:0 → translateY(0) opacity:1` | Entrada de modais |
| `spin` | Rotação 360° linear | Loading spinners |
| Shine `::after` | Sweep diagonal branco nos botões | Todos os `.btn` e `.btn-icon` no hover |
| Hover lift | `transform: translateY(-4px)` | `.stat-card:hover` |
| Hover bounce | `transform: translateY(-2px)` | `.btn-primary:hover`, `.btn-danger:hover` |
