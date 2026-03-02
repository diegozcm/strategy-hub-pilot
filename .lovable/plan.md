

## Redesign da Landing Page — Inspirada no Layout de Referência

### O que muda

A página atual tem uma estrutura funcional, mas o layout é uniforme demais. A referência mostra um padrão SaaS moderno com mais impacto visual: stats inline no hero, badges acima dos títulos, seções com layout dividido (texto + imagem), banners de CTA entre seções, FAQ em layout split (título à esquerda, accordion à direita), e muito mais respiro entre elementos.

### Nova estrutura de seções (mantendo os 15 componentes existentes)

```text
#   SEÇÃO                    MUDANÇA PRINCIPAL
1   Header                   Pill nav com fundo glass, botão "Começar" verde
2   Hero                     Stats inline (200+ empresas, 15+ anos, etc.), badge pill, tipografia maior
3   ClientLogos              Sem mudança grande, apenas refinamento visual
4   ValueProposition         6 cards (3x2) com ícones + hover glow, como a ref "Solutions for Accelerated Growth"
5   SystemDemo               Layout split: texto+CTAs à esquerda, screenshot à direita (como "Start Growing Smarter")
6   Diferenciais → CTA Banner  Transformar em banner escuro com gradiente + CTA (como "Unlock Exclusive Savings")
7   HowItWorks               4 steps horizontais, com números grandes e linha conectora
8   PlatformFeatures         Layout split com imagem + cards menores (manter como está, refinar)
9   AtlasHighlight           Manter layout split, refinar
10  Services                 Layout "Our Commitment": headline + grid 2x1 com cards descritivos
11  UseCases                 Remodelar como cards com fundo escuro e borda sutil
12  Authority                Stats integrados no Hero — esta seção vira Testimonials/Social Proof
13  FAQ                      Layout split: título + CTA à esquerda, accordion à direita
14  CTA Final                Banner full-width com gradiente
15  Footer                   2 colunas: brand+descrição à esquerda, links à direita
```

### Mudanças detalhadas por componente

**HeroSection.tsx** — Redesign completo
- Badge pill verde no topo ("Plataforma de Gestão Estratégica")
- Título maior (text-5xl/6xl) com line-height tight
- Stats inline abaixo dos botões: "200+ Empresas", "15+ Anos", "95% Satisfação"
- Screenshot à direita usando ScreenshotImage existente
- Remover os stats da AuthoritySection (agora vivem no hero)

**ValuePropositionSection.tsx** — Expandir para 6 cards
- Adicionar 3 cards novos (total 6) em grid 3x2
- Cada card com ícone em fundo sutil, título e descrição curta
- Hover: borda verde + shadow elevada

**SystemDemoSection.tsx** — Layout split
- Lado esquerdo: badge, headline "Conheça a plataforma por dentro", parágrafo, dois botões
- Lado direito: screenshot carousel (manter lógica existente)
- Fundo navy com gradiente sutil

**DifferentialsSection.tsx** → Banner CTA
- Transformar em banner horizontal escuro com gradiente diagonal
- Texto à esquerda com headline de impacto
- Botão CTA verde à direita
- Screenshot/gráfico decorativo opcional

**ServicesSection.tsx** — Layout "Commitment"
- Headline centralizada no topo
- Grid 2 colunas abaixo com cards maiores (só 2-3 principais serviços destacados)
- Ou manter 6 cards mas com mais respiro

**FAQSection.tsx** — Layout split
- Coluna esquerda: título "Perguntas frequentes", subtítulo, botão CTA "Fale conosco"
- Coluna direita: accordion com as perguntas
- Grid lg:grid-cols-[1fr_2fr]

**AuthoritySection.tsx** — Simplificar
- Stats movidos para o hero, esta seção pode virar um bloco de prova social ou ser removida
- Alternativa: manter como seção de números animados mas mais compacta

**FooterSection.tsx** — Refinamento
- Layout mais limpo com 2-3 colunas
- Linha separadora sutil
- Copyright na base

### Tipografia (usando fontes Cofound existentes)
- Títulos de seção: `text-3xl md:text-5xl font-display font-bold`
- Subtítulos: `text-lg md:text-xl font-sans text-opacity-60`
- Cards títulos: `text-lg font-display font-semibold`
- Body: `text-base font-sans`

### Cores (mantendo identidade Cofound)
- Fundos escuros: `cofound-blue-dark` (#0D2338)
- Fundos claros: `cofound-white` (#F7F7F7)
- CTA/destaques: `cofound-green` (#CDD966)
- Ícones/links: `cofound-blue-light` (#38B6FF)
- Cards em fundo claro: `bg-white border-cofound-blue-dark/8`
- Cards em fundo escuro: `bg-white/[0.03] border-white/10`

### Arquivos modificados
| Arquivo | Escopo |
|---|---|
| HeroSection.tsx | Redesign com stats inline + screenshot |
| ValuePropositionSection.tsx | Expandir para 6 cards |
| SystemDemoSection.tsx | Layout split texto+carousel |
| DifferentialsSection.tsx | Transformar em banner CTA |
| ServicesSection.tsx | Layout refinado tipo "Commitment" |
| FAQSection.tsx | Layout split (título esquerda, accordion direita) |
| AuthoritySection.tsx | Simplificar/compactar |
| FooterSection.tsx | Refinamento visual |
| HeaderSection.tsx | Pill nav refinado |

Zero novas dependências. Todos os componentes existentes são reutilizados.

