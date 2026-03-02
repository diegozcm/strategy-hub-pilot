

## Reforma Completa da Landing Page Strategy HUB

### Diagnostico do problema atual

A pagina atual e um bloco monolitico de fundo navy escuro (#0D2338) sem variacao visual. Todas as 7 secoes usam o mesmo fundo, criando monotonia. Os cards sao identicos em formato (grid 3x2), sem hierarquia. Nao ha imagens, animacoes, prova social real, FAQ, fluxo de funcionamento, nem alternancia de cores. O resultado e uma pagina "plana" e textual, sem impacto premium.

### Nova arquitetura de secoes (15 secoes)

```text
 #   SECAO                    FUNDO           OBJETIVO
 1   Header                   Navy fixo       Navegacao + CTA Login
 2   Hero                     Navy + glow     Impacto inicial, proposta de valor
 3   Logos clientes (marquee) Branco          Prova social imediata
 4   Proposta de valor        Branco          3 pilares lado a lado
 5   Demo do sistema          Navy            Screenshot carousel interativo
 6   Diferenciais             Branco          Cards com numeros/metricas
 7   Como funciona            Navy            Passo a passo (1-2-3-4) visual
 8   Features plataforma      Branco          Grid com icones + imagem lateral
 9   Atlas IA (destaque)      Navy gradient   Feature hero com imagem
10   Servicos COFOUND         Branco          Grid de servicos consultoria
11   Casos de uso             Navy            Cards por perfil (CEO, gestor...)
12   Numeros/Autoridade       Verde gradient  Metricas impactantes (counter)
13   FAQ                      Branco          Accordion expandivel
14   CTA Final                Navy gradient   Conversao final
15   Footer                   Navy escuro     Links, contato, redes
```

### Estrategia visual

- **Alternancia navy/branco** em cada secao para criar ritmo
- **Verde #CDD966** usado em: CTAs principais, badges, numeros de destaque, bordas de cards hover, contadores
- **Azul #38B6FF** em: destaques secundarios, icones, links
- Secoes brancas: fundo `#F7F7F7` com cards brancos e sombras sutis
- Secoes navy: fundo `#0D2338` ou `#0E263D` com glassmorphism

### Estrategia de motion (usando `motion` - ja instalado)

| Secao | Animacao |
|---|---|
| Hero | Fade-up staggered no titulo/subtitulo/botoes |
| Logos | Marquee continuo CSS (ja existe) |
| Proposta de valor | Cards fade-in ao scroll (IntersectionObserver) |
| Demo carousel | Slide horizontal com indicadores, auto-play |
| Como funciona | Steps revelados sequencialmente ao scroll |
| Features | Imagem slide-in lateral + cards stagger |
| Atlas IA | Parallax sutil no glow de fundo |
| Numeros | Counter animado (de 0 ate o valor final) |
| FAQ | Accordion nativo Radix (ja disponivel) |
| CTAs | Hover scale + shine sweep nos botoes |

Todas as animacoes usam a lib `motion` (Framer Motion) ja instalada. Nenhuma dependencia nova necessaria.

### Placeholders de imagem do sistema

Cada placeholder sera um `div` estilizado com borda, fundo escuro, e descricao, prontos para substituicao:

1. **hero-dashboard.png** - Dashboard RUMO com grafico de progresso, pilares estrategicos e KPIs
2. **mapa-estrategico.png** - Mapa estrategico visual com pilares, objetivos e KRs conectados
3. **okrs-panel.png** - Painel de OKRs com barras de progresso e status por cores
4. **atlas-ia-chat.png** - Interface do Atlas IA com conversa e sugestoes inteligentes
5. **ferramentas-swot.png** - Ferramenta SWOT preenchida com analise real
6. **projetos-kanban.png** - Visao Kanban de projetos com cards e responsaveis

### Carousel estrategico

Carousel de screenshots do sistema na secao "Demo", mostrando as 6 telas principais. Implementado com `motion` (AnimatePresence + drag gestures) com:
- Auto-play a cada 5s
- Indicadores de paginacao
- Transicao slide suave
- Pausa no hover

### Estrutura de arquivos

**Arquivos modificados:**
- `src/pages/landing/LandingPageBase.tsx` - Reescrita completa com 15 secoes
- `src/index.css` - Adicionar keyframes de counter e ajustes

**Novos componentes (dentro de `src/pages/landing/`):**
- `HeroSection.tsx` - Hero com animacoes motion
- `ClientLogosSection.tsx` - Marquee de logos
- `ValuePropositionSection.tsx` - 3 pilares
- `SystemDemoSection.tsx` - Carousel de screenshots
- `DifferentialsSection.tsx` - Cards com metricas
- `HowItWorksSection.tsx` - Passo a passo visual
- `PlatformFeaturesSection.tsx` - Grid features + imagem
- `AtlasHighlightSection.tsx` - Destaque Atlas IA
- `ServicesSection.tsx` - Servicos COFOUND
- `UseCasesSection.tsx` - Cards por perfil
- `AuthoritySection.tsx` - Numeros animados
- `FAQSection.tsx` - Accordion com Radix
- `CTASection.tsx` - CTA final
- `FooterSection.tsx` - Footer
- `ScreenshotPlaceholder.tsx` - Componente reutilizavel de placeholder
- `AnimatedCounter.tsx` - Counter animado
- `useScrollReveal.ts` - Hook de IntersectionObserver para animacoes

### Conteudo por secao

**Proposta de valor (3 pilares):**
- Estrategia conectada a execucao
- Decisoes baseadas em dados
- IA como copiloto estrategico

**Diferenciais:**
- "+200 empresas atendidas"
- "+15 anos de experiencia"
- "95% de satisfacao"
- "+500 projetos estrategicos"

**Como funciona (4 steps):**
1. Diagnostico → 2. Planejamento → 3. Execucao → 4. Resultados

**Casos de uso:**
- CEO/Fundador - Visao estrategica unificada
- Gestor de area - OKRs e acompanhamento
- Consultor - Ferramentas e metodologias
- Startup - Aceleracao e validacao

**FAQ (6 perguntas):**
- O que e o Strategy HUB?
- Para quem e indicado?
- Como funciona a IA Atlas?
- Posso usar sem consultoria?
- Quanto tempo para implementar?
- Como comecar?

### Detalhes tecnicos

- Todas as animacoes usam `motion` (ja instalado como dependencia)
- FAQ usa `@radix-ui/react-accordion` (ja instalado)
- Carousel usa `motion`'s `AnimatePresence` + estado local
- Counter usa `useEffect` + `requestAnimationFrame`
- Scroll reveal via `IntersectionObserver` customizado
- Zero novas dependencias

