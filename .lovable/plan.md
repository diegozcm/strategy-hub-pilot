

## Plano: Redesign Visual do Atlas Hub Chat (UX-Driven)

### Pesquisa UX aplicada
Baseado em best practices de CometChat, Sendbird e UXPin:
- **Alto contraste** entre fundo, bolhas e texto (regra #21 CometChat)
- **Ações fora da bolha** — pattern usado por ChatGPT, Claude e Slack: botões de ação ficam abaixo da mensagem, não dentro, para não poluir o conteúdo
- **Avatares em ambos os lados** — identifica visualmente quem fala, reduz carga cognitiva
- **Fundo escuro na área de chat** — cria hierarquia visual clara entre sidebar/input e área de conversa

### Mudanças

**1. `src/components/ai/atlas/AtlasChatArea.tsx`** — Fundo escuro na área de mensagens
- Trocar fundo da ScrollArea de `bg-background` (branco) para `bg-[hsl(var(--cofound-blue-dark))]/60` (navy translúcido)
- Typing indicator: bolha com `bg-[hsl(var(--cofound-blue-dark))]` em vez de `bg-muted`

**2. `src/components/ai/atlas/AtlasMessageBubble.tsx`** — Redesign completo
- **Estrutura**: Mudar layout para coluna — avatar+bolha em uma row, botões de ação em row separada abaixo
- **User messages**: Adicionar avatar do usuário (iniciais ou ícone User) à direita da bolha. Bolha com `bg-[hsl(var(--cofound-blue-light))]` (azul claro, mais visível que o navy atual)
- **Assistant messages**: Manter AtlasOrb à esquerda. Bolha com `bg-card/90 backdrop-blur` para contraste elegante contra fundo escuro
- **Botões de ação** (copiar, retry, like, dislike): Mover para **fora** da bolha, em uma row abaixo alinhada com o início da bolha (após o avatar). Aparecem on-hover do grupo. Sem borda, sem border-top
- **User action buttons** (copiar): Também fora da bolha, alinhado à direita

**3. `src/components/ai/atlas/AtlasInputBar.tsx`** — Cores mais ricas
- Container externo: `bg-[hsl(var(--cofound-blue-dark))]/40` em vez de `bg-card`
- Input box: `bg-card/80 backdrop-blur` com borda `border-[hsl(var(--cofound-blue-light))]/20`
- Botão Plan: manter lógica COFOUND green atual
- Botão send: manter COFOUND blue-light

**4. `src/components/ai/atlas/AtlasSidebar.tsx`** — Harmonizar com fundo escuro
- Fundo: `bg-[hsl(var(--cofound-blue-dark))]/30` em vez de `bg-card`
- Texto e separadores: ajustar para contraste no tom escuro

**5. `src/components/ai/atlas/AtlasWelcome.tsx`** — Fundo escuro consistente
- Fundo da página: herda o fundo escuro do chat area
- Cards de quick-action: `bg-card/80 backdrop-blur` com borda `cofound-blue-light`

**6. `src/components/ai/AtlasHubPage.tsx`** — Fundo base
- Adicionar `bg-[hsl(var(--cofound-blue-dark))]/20` como fundo base do container principal

### Resultado visual esperado
```text
┌─────────────┬──────────────────────────────────────┐
│  Sidebar    │  ████████ Fundo navy escuro ████████ │
│  (navy      │                                      │
│   translúc) │         [Orb] ┌─────────────┐        │
│             │               │ Bolha card  │        │
│  + Nova     │               └─────────────┘        │
│  ◎ Insights │               📋 🔄 👍 👎  ← fora   │
│             │                                      │
│  sessões... │    ┌──────────────┐ [Avatar User]    │
│             │    │ Bolha azul   │                   │
│             │    └──────────────┘                   │
│             │                          📋 ← fora   │
│             │                                      │
│             │  ┌────────────────────────────────┐   │
│             │  │ Input (card/blur)              │   │
│             │  │ [+] Plan          [🎤] [➤]    │   │
│             │  └────────────────────────────────┘   │
└─────────────┴──────────────────────────────────────┘
```

