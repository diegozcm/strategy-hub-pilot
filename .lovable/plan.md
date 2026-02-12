
# Redesign do Chat do Atlas - Dark Mode + UX Moderna

## Resumo

Transformar o chat flutuante do Atlas em uma interface dark mode moderna inspirada no modelo enviado, com melhorias de UX no drag, fechamento por clique externo, e efeito visual no botao de audio.

## Mudancas Visuais

### 1. Dark Mode forcado no chat
O card do chat tera fundo escuro fixo (independente do tema da aplicacao), usando cores como `#0a0a0f` para o fundo principal, bordas sutis com gradiente animado (estilo neon), e textos claros. Isso combina com o botao Atlas que ja e preto.

### 2. Header redesenhado
- Fundo escuro com leve transparencia
- Icone do Atlas com o mesmo efeito ColorOrb em miniatura (ou um gradiente sutil)
- Titulo "Atlas" com fonte mais moderna
- Apenas botao de fechar (X) e historico - remover botao de minimizar

### 3. Area de mensagens
- Mensagens do usuario: bolha com gradiente sutil (azul escuro para ciano)
- Mensagens do assistente: fundo escuro mais claro (`#1a1a2e`)
- Typing indicator com bolinhas que pulsam em cores do ColorOrb (verde, azul, ciano)
- Scrollbar estilizada para dark

### 4. Input redesenhado
- Input com fundo escuro, borda sutil com brilho ao focar
- Botoes com estilo mais moderno (bordas arredondadas, hover com glow)
- Ordem mantida: [Texto] [Plan] [Mic] [Send]

### 5. Borda animada externa
- Borda fina com gradiente animado rotacionando (verde -> azul -> ciano) ao redor do card, similar ao modelo enviado

## Mudancas de UX

### 6. Fechar ao clicar fora
- Adicionar overlay invisivel (ou event listener) que fecha o chat ao clicar fora dele

### 7. Remover minimizar
- Remover botao de minimizar e prop `isMinimized`
- Chat so abre ou fecha

### 8. Melhorar drag and drop
- Usar `user-select: none` no body durante o drag para evitar selecao de texto
- Permitir posicionamento livre (remover snap para esquerda/direita)
- Adicionar `will-change: transform` para performance

### 9. Botao de audio com efeito ColorOrb
- Quando gravando, em vez de fundo vermelho, o botao tera o efeito ColorOrb como fundo (mesma animacao do botao Atlas)
- Cores com saturacao reduzida para o icone branco (Square) se destacar
- Usar `oklch` com luminosidade mais baixa (~50-55%) para contraste com o icone branco

## Secao Tecnica

### Arquivos a modificar

**`src/components/ai/FloatingAIChat.tsx`** (principal):
- Aplicar classes dark mode forcado no Card e todos os elementos internos
- Remover botao Minus e logica de `isMinimized`
- Adicionar overlay de clique externo
- Melhorar drag: adicionar `document.body.style.userSelect = 'none'` no mousedown, restaurar no mouseup
- Remover constraint de snap (manter posicionamento livre como ja esta, mas sem limite rigido)
- Redesenhar bolhas de mensagem com gradientes escuros
- Adicionar borda animada com pseudo-elemento CSS
- Botao de audio: quando `isRecording`, renderizar div com classe `color-orb-atlas` como fundo do botao, com cores dessaturadas

**`src/components/ai/FloatingAIButton.tsx`**:
- Nenhuma mudanca (ja esta correto)

**`src/hooks/useFloatingAI.tsx`**:
- Remover estado `isMinimized` e `toggleMinimize`

**`src/components/layout/AppLayout.tsx`**:
- Remover props `isMinimized` e `onMinimize` do FloatingAIChat

**`src/index.css`**:
- Adicionar keyframe para borda animada giratoria do chat
- Adicionar variante dessaturada do ColorOrb para o botao de audio (`.color-orb-atlas-subtle` com cores mais escuras)

### Paleta dark do chat
- Fundo principal: `#08080f`
- Fundo card: `#0d0d1a`
- Fundo mensagem assistente: `#151525`
- Fundo mensagem usuario: gradiente `#0a2a4a` -> `#0a3a5a`
- Borda: `rgba(56, 182, 255, 0.15)`
- Texto principal: `#e0e0e0`
- Texto secundario: `#888`
- Borda animada: gradiente rotatorio com as cores do ColorOrb

### ColorOrb no botao de audio (gravando)
- `--base`: `oklch(8% 0.01 240)` (quase preto)
- `--accent1`: `oklch(50% 0.12 150)` (verde escuro)
- `--accent2`: `oklch(55% 0.12 230)` (azul medio)
- `--accent3`: `oklch(52% 0.10 200)` (ciano escuro)
- Luminosidade baixa para o icone branco se destacar
