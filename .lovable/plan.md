

## Plano: COFOUND Identity + Fixes no Atlas Hub

### Problemas identificados

1. **Input bar cortado** - O container usa `-m-4 lg:-m-6` mas o `h-full` não compensa, cortando o fundo da página
2. **Visual genérico** - Usa cores padrão do design system sem identidade COFOUND
3. **Ícone Brain** - Precisa trocar pelo ColorOrb animado na sidebar e nas mensagens do assistant
4. **Popup aparece no Atlas Hub** - O FloatingAIButton/Chat não esconde quando estamos em `/app/atlas-hub`

### Mudanças por arquivo

**1. `src/components/ai/AtlasHubPage.tsx`**
- Corrigir layout: trocar `-m-4 lg:-m-6` por dimensões absolutas que ocupem 100% do espaço disponível
- Adicionar mini ColorOrb ao lado do título "Atlas Hub" no header

**2. `src/components/layout/Sidebar.tsx`**
- Trocar ícone `Brain` por um mini ColorOrb (`color-orb-atlas`) no botão Atlas Hub
- Aplicar cor `cofound-green` (#CDD966) quando ativo, `cofound-blue-light` (#38B6FF) quando inativo

**3. `src/components/ai/atlas/AtlasWelcome.tsx`**
- Trocar ícone Sparkles por ColorOrb animado como avatar central
- Aplicar cores COFOUND: botões quick-action com borda `cofound-blue-light`, hover com `cofound-green`

**4. `src/components/ai/atlas/AtlasMessageBubble.tsx`**
- Adicionar mini ColorOrb ao lado das mensagens do assistant (avatar)
- User messages: usar `cofound-blue-dark` como background
- Assistant messages: manter `bg-muted` mas com accent colors COFOUND nos botões de ação

**5. `src/components/ai/atlas/AtlasInputBar.tsx`**
- Botão send: usar `cofound-blue-light` como background
- Botão Plan ativo: usar `cofound-green` como accent
- Garantir padding-bottom suficiente para não ficar cortado

**6. `src/components/ai/atlas/AtlasSidebar.tsx`**
- Botão "Nova conversa": estilo com `cofound-blue-light`
- Sessão ativa: highlight com `cofound-green`
- Ícone Insights: cor `cofound-green`

**7. `src/components/ai/atlas/AtlasChatArea.tsx`**
- Typing indicator dots: usar `cofound-blue-light` ao invés de `bg-primary`

**8. `src/components/layout/AppLayout.tsx`**
- Verificar rota atual via `useLocation()` - se for `/app/atlas-hub`, esconder tanto o `FloatingAIButton` quanto o `FloatingAIChat`

### ColorOrb reutilizável
Criar um componente inline simples `AtlasOrb` que renderiza a div `color-orb-atlas` com as CSS variables corretas, aceita props de tamanho. Usado em:
- Sidebar (20x20px)
- Welcome page (80x80px) 
- Message bubbles (28x28px)
- Chat header (24x24px)

