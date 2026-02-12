

# Substituir Botao Atlas por Orb Animado com Transicao Morph

## Resumo

O botao flutuante do Atlas (rosto SVG) sera substituido por um orbe animado com gradiente colorido em tons azul/verde/escuro (identidade Cofound). Ao clicar, o orbe se expande suavemente em uma animacao "morph" ate virar o painel completo do chat, mantendo todas as funcionalidades existentes (texto, Plan, microfone, enviar, historico, minimizar, fechar).

## O que muda visualmente

1. **Botao flutuante**: Circulo com gradiente animado (tons azul escuro, verde e navy) girando internamente, substituindo o rosto SVG
2. **Hover**: O orbe cresce ligeiramente (scale 1.15) e ganha mais brilho/saturacao
3. **Clique**: Animacao morph - o circulo se expande suavemente ate as dimensoes do painel de chat (usando `motion` para layout animations)
4. **Chat aberto**: Mantém todas as funcionalidades atuais do Atlas intactas
5. **Fechar**: Animacao reversa - o painel contrai de volta ao circulo do orbe

## Secao Tecnica

### Dependencia nova
- Instalar `motion` (substituto moderno do framer-motion, ja usado no componente de referencia)

### Arquivos modificados

**1. `src/components/ai/FloatingAIButton.tsx`** - Reescrever completamente
- Remover o SVG do rosto e os olhos que seguem o cursor
- Implementar o componente `ColorOrb` com CSS `conic-gradient` animado via `@property --angle`
- Tons: base navy (`oklch(22% 0.03 260)`), accent1 verde cofound (`oklch(55% 0.12 140)`), accent2 azul (`oklch(60% 0.15 240)`), accent3 azul escuro (`oklch(40% 0.10 260)`)
- Dimensao do orbe: 56px (mesmo tamanho do botao atual)
- Velocidade de rotacao: `spinDuration: 12` (mais rapida que o padrao 20)
- Hover: `scale(1.15)` + filtro `brightness(1.2)` via transicao CSS
- Manter badge de notificacoes (unreadCount)
- Usar CSS puro para a animacao do orbe (sem dependencia de `motion` no botao em si)

**2. `src/components/ai/FloatingAIChat.tsx`** - Adicionar animacao morph
- Importar `motion` e `AnimatePresence` de `motion/react`
- Envolver o `Card` principal com `motion.div` usando `layoutId="atlas-chat"`
- Animacao de entrada: escalar de 56x56 (posicao do botao, canto inferior direito) ate 384x600 (dimensoes do chat)
- Animacao de saida: reverso, contraindo de volta ao circulo
- Usar `initial`, `animate`, `exit` com spring physics para suavidade
- O `layoutId` compartilhado entre botao e chat cria a transicao morph automatica

**3. `src/components/layout/AppLayout.tsx`** - Ajustar integracao
- Envolver o botao e chat com `AnimatePresence` do motion
- Adicionar `layoutId="atlas-chat"` ao botao para conectar a animacao morph com o chat
- O botao sempre renderiza (sem condicional `!floatingAI.isOpen`), pois o `AnimatePresence` controla a transicao

### Abordagem da animacao morph

A transicao sera feita com `motion` layout animations:
- O botao e o chat compartilham um `layoutId`
- Quando o estado muda de "fechado" para "aberto", o `motion` interpola automaticamente posicao, tamanho e border-radius
- O botao comeca como circulo (border-radius 50%, 56x56px) no canto inferior direito
- O chat termina como retangulo arredondado (border-radius 12px, 384x600px) na posicao do painel
- A animacao e controlada por spring physics para naturalidade

### Estrutura CSS do ColorOrb

O orbe usa `conic-gradient` com multiplas camadas e uma CSS custom property `--angle` animada via `@keyframes spin`. Isso cria o efeito de gradiente rotativo sem JavaScript. O `blur` e `contrast` no pseudo-elemento `::before` criam o efeito de fusao de cores organico.

