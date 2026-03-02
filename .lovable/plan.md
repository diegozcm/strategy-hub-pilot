

## Plano de Rebrand: Landing Page Strategy HUB by COFOUND

### Situacao atual vs. Objetivo

A landing page atual usa cores genéricas (cyan/lime), tem um visual "template SaaS" sem personalidade, texto placeholder e nenhuma conexao visual com o site institucional cofound.com.br. O objetivo é transformá-la em uma página premium com a identidade visual escura/navy da COFOUND, focada no Strategy HUB como produto principal.

### Diretrizes visuais (espelhando cofound.com.br)

- Fundo predominante: Navy escuro (#0D2338 / #0E263D)
- Textos claros sobre fundo escuro
- Acentos: Azul Claro (#38B6FF) para highlights e CTAs, Verde (#CDD966) para badges/destaques
- Fontes: Saira para títulos, Lexend para corpo (já configuradas)
- Cards com bordas sutis brancas/10% sobre fundo navy mais claro
- Sem os tons cyan/lime genéricos atuais

### Estrutura de secoes (7 secoes)

```text
1. HEADER         - Fixo, fundo navy escuro, logo COFOUND + nav + CTA Login
2. HERO           - Full-width navy escuro, headline impactante sobre 
                    o Strategy HUB, subtítulo, 2 botões (CTA + WhatsApp)
3. SERVICOS       - Grid de cards (Jornada Estratégica, Aceleração 
   COFOUND          de Vendas, Diagnóstico 360, Conselho Consultivo,
                    Startups) sobre fundo navy com cards semi-transparentes
4. PLATAFORMA     - Showcase das features do Strategy HUB 
   (Strategy HUB)   (Dashboard RUMO, Mapa Estratégico, OKRs, Atlas IA,
                    Ferramentas, Projetos) com screenshots/mockups
5. LOGOS          - Carousel horizontal de logos de clientes 
   CLIENTES        ("Quem já viveu a experiência Cofound") com 
                    animação marquee, fundo navy
6. CTA FINAL      - Gradiente navy→azul, headline + 2 botões
7. FOOTER         - Navy escuro, links, contato, redes sociais, copyright
```

### Mudancas tecnicas

**Arquivo principal: `src/pages/landing/LandingPageBase.tsx`** (reescrita completa)

- Remover sistema de dual-theme (cofound/strategy) -- manter apenas o tema COFOUND dark
- Simplificar os ~180 tokens de tema para classes diretas
- Reestruturar as 7 secoes conforme acima
- Remover secoes que nao fazem mais sentido (BEEP, testimonials genéricos, Demo carousel)
- Adicionar secao de servicos COFOUND com conteúdo real do site institucional
- Adicionar carousel de logos de clientes com animacao marquee CSS
- Manter integração CMS (`getContent`) para textos editáveis

**Arquivo: `src/index.css`**

- Adicionar keyframes de animacao `marquee` para carousel de logos
- Ajustar variaveis legacy do cofound se necessário

**Notas de CMS:**
- Os textos continuam editáveis via `getContent()` com fallbacks reais
- Logos de clientes poderão ser gerenciados pelo CMS existente ou hardcoded inicialmente

### Conteudo real (extraído do cofound.com.br)

- **Headline**: "Cocriamos soluções adequadas às complexidades das organizações"
- **Servicos**: Jornada Estratégica, Aceleração de Vendas, Palestras & Workshops, Diagnóstico 360, Conselho Consultivo, Aceleração de Startups
- **Contato**: Ágora Tech Park, Joinville/SC
- **Redes**: LinkedIn, Instagram, Spotify, YouTube

