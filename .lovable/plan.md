

# Aplicar Identidade Visual COFOUND no Strategy HUB

## Resumo
Aplicar o Design System da COFOUND nas paginas do Strategy HUB (modulo do usuario: Dashboard, Mapa Estrategico, Objetivos, Indicadores, Projetos, Ferramentas), incluindo tipografia (Lexend + Saira), paleta de cores atualizada, botoes com efeito shine, sombras premium e suporte completo a dark mode. As cores de performance (vermelho, amarelo, verde, azul) nao serao alteradas.

## Escopo

### O que sera alterado
- CSS Variables (light e dark) no `src/index.css`
- Tipografia: adicionar fonte Saira no `index.html` e `tailwind.config.ts`
- Adicionar cor `brand` (verde CDD966) e sombras premium ao Tailwind config
- Botao (`src/components/ui/button.tsx`): adicionar variante `brand` com efeito shine
- Sidebar do Strategy (`src/components/layout/Sidebar.tsx`): aplicar cores navy/brand
- Header (`src/components/layout/DashboardHeader.tsx`): cores navy
- Dashboard (`src/components/dashboard/DashboardHome.tsx`): tipografia display nos titulos, cores brand
- Rumo components: tipografia e bordas premium
- Mapa Estrategico (`StrategicMapPage.tsx`): tipografia e botoes brand
- Cards de KR e Objetivo: sombras premium, hover refinado

### O que NAO sera alterado
- Cores de performance: vermelho, amarelo, verde e azul dos indicadores
- Logica de calculo ou dados
- Paginas do admin-v2 (ja tem identidade propria)
- Landing page

## Detalhes Tecnicos

### 1. Fontes - `index.html`
Adicionar a fonte Saira ao link do Google Fonts (ja tem Lexend):
```
family=Lexend:wght@300;400;500;600&family=Saira:wght@500;600;700
```

### 2. Tailwind Config - `tailwind.config.ts`
- Adicionar `fontFamily.sans` com Lexend como padrao
- Adicionar `fontFamily.display` com Saira para titulos
- Adicionar cor `brand` com variavel CSS
- Adicionar `boxShadow.elev` e `boxShadow.soft`

### 3. CSS Variables - `src/index.css`

**Light theme** (ajustes principais):
- `--foreground`: de `0 0% 10%` para `207 62% 14%` (navy como cor de texto)
- Adicionar `--brand: 66 59% 63%` e `--brand-foreground: 207 62% 14%`
- `--secondary`: ajustar para branco puro com foreground navy
- `--muted-foreground`: navy mais suave `207 18% 38%`
- `--border` e `--input`: tom navy suave `207 18% 88%`
- `--accent-foreground`: navy `207 62% 14%`
- Adicionar variaveis de sombra premium
- Sidebar: fundo navy `207 62% 14%`, texto claro, accent verde brand

**Dark theme:**
- `--background`: navy escuro `207 62% 8%`
- `--card`: navy `207 55% 10%`
- `--border`: navy `207 35% 16%`
- `--brand`: manter verde `66 59% 63%`
- Sidebar: navy escuro com accent verde
- Adicionar regra CSS `h1-h6 { font-display }`

### 4. Botao - `src/components/ui/button.tsx`
- Adicionar efeito shine diagonal como classe base (pseudo-element `before:`)
- Adicionar micro-interacao `hover:scale-[1.02]` e `active:scale-[0.98]`
- Adicionar variante `brand` (fundo verde CDD966, texto navy)
- Manter todas as variantes existentes + cofound variants

### 5. Sidebar - `src/components/layout/Sidebar.tsx`
- Fundo navy escuro (`bg-sidebar`) em vez de `bg-card`
- Texto claro (`text-sidebar-foreground`)
- Items ativos: fundo `sidebar-accent` com texto `sidebar-accent-foreground`
- Icone Target e titulo "Strategy HUB" em branco/brand
- Borda lateral em tom navy

### 6. Header - `src/components/layout/DashboardHeader.tsx`
- Manter limpo com fundo `bg-card` (branco no light, navy escuro no dark)
- Avatar fallback com cor brand

### 7. Dashboard Home - `src/components/dashboard/DashboardHome.tsx`
- Titulo "Strategy HUB" com `font-display` (Saira)
- Cards de stats: sombra `shadow-soft`, hover com `shadow-elev`
- Tabs com estilo refinado

### 8. Rumo Components
- `RumoPillarBlock.tsx`: `font-display` no nome do pilar
- `RumoObjectiveBlock.tsx`: tipografia display
- `RumoLegend.tsx`: manter cores de performance inalteradas
- `RumoDashboard.tsx`: titulo com font-display

### 9. Strategic Map Page
- Titulo "Pilares Estrategicos" com `font-display`
- Botao "Adicionar Pilar" com variante `brand`
- Cards com `shadow-soft` e hover premium

### 10. Objective Card / ResultadoChaveMiniCard
- Sombras premium nos cards
- Hover com `shadow-elev`
- Manter cores de performance inalteradas

## Ordem de Implementacao
1. CSS Variables e Tailwind Config (base de tudo)
2. Fonts no index.html
3. Regra CSS base para h1-h6 font-display
4. Button component (shine + brand)
5. Sidebar (navy theme)
6. Header
7. Dashboard e Rumo components
8. Strategic Map e cards

