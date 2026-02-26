

## Plano: Atlas Hub Full-Page Chat na Sidebar

### Contexto Atual
- O botão "Atlas Hub" fica no **header** (`DashboardHeader.tsx`) e linka para `/app/ai-copilot` (página de insights/diagnóstico)
- O chat do Atlas é um **popup flutuante** (`FloatingAIChat.tsx`, 1210 linhas) com todas as ferramentas (texto, Plan, mídia, microfone, streaming, histórico de sessões, execução de planos)
- A sidebar (`Sidebar.tsx`) tem duas seções: STRATEGY HUB e STARTUP HUB
- A página de insights (`AICopilotPage.tsx`) mostra diagnóstico estratégico, não o chat

### O que muda

**1. Mover Atlas Hub para a Sidebar (acima do Strategy HUB)**
- Adicionar um botão "Atlas Hub" com ícone Brain no topo da sidebar, antes da seção STRATEGY HUB
- Visível apenas quando `hasAIAccess === true`
- Ao clicar, navega para `/app/atlas-hub` (nova rota full-page)

**2. Remover botão do Header**
- Remover o bloco `NavLink to="/app/ai-copilot"` do `DashboardHeader.tsx`

**3. Criar página full-page do Atlas Chat (`/app/atlas-hub`)**
Layout estilo Claude/ChatGPT com 3 painéis:

```text
┌──────────┬─────────────────────────────────┐
│ Sidebar  │  Atlas Hub Chat (full-page)     │
│ (app)    │                                 │
│          │ ┌─────────┬───────────────────┐  │
│ [Atlas]  │ │ Panel   │                   │  │
│ ──────── │ │ Lateral │   Área de Chat    │  │
│ STRATEGY │ │         │                   │  │
│  Dashboard│ │ - Nova  │  Mensagens com    │  │
│  Mapa... │ │   conversa│  markdown, plans │  │
│          │ │ - Histórico│  streaming      │  │
│ STARTUP  │ │ - Insights│                  │  │
│  ...     │ │         │ ┌───────────────┐ │  │
│          │ │         │ │ Input bar     │ │  │
│          │ │         │ │ +Plan Mic Send│ │  │
│          │ │         │ └───────────────┘ │  │
│          │ └─────────┴───────────────────┘  │
└──────────┴─────────────────────────────────┘
```

**Panel lateral esquerdo** (colapsável):
- Botão "Nova conversa"
- Lista de sessões anteriores (reutiliza `ai_chat_sessions` existente)
- Seção "Insights" que mostra os insights do diagnóstico (reutiliza lógica do `AICopilotPage`)

**Área de chat principal:**
- Tela de boas-vindas (quando sem conversa ativa) inspirada no modelo enviado: logo Atlas animado, mensagem de boas-vindas, sugestões rápidas (Análise de Performance, Pontos de Atenção, Sugestões)
- Área de mensagens com scroll, markdown rendering, blocos [ATLAS_PLAN] com aprovar/reprovar
- Barra de input na parte inferior com: botão anexo (+), toggle Plan, microfone, botão enviar
- Mesma lógica de streaming SSE, transcrição de áudio, upload de imagens

**4. Reutilização de lógica existente**
- Toda a lógica de `FloatingAIChat.tsx` (streaming, plan extraction, session management, plan execution, audio recording) será extraída para um hook `useAtlasChat` compartilhado
- O `FloatingAIChat.tsx` popup continua existindo mas usa o mesmo hook
- A nova página full-page usa o mesmo hook com layout diferente

**5. Manter o popup flutuante**
- O botão flutuante + popup continuam funcionando normalmente para acesso rápido
- O chat full-page é a experiência completa; o popup é o atalho

### Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useAtlasChat.ts` | **Criar** - Extrair lógica de chat do FloatingAIChat |
| `src/components/ai/AtlasHubPage.tsx` | **Criar** - Página full-page principal |
| `src/components/ai/atlas/AtlasSidebar.tsx` | **Criar** - Panel lateral com sessões + insights |
| `src/components/ai/atlas/AtlasChatArea.tsx` | **Criar** - Área de chat com mensagens |
| `src/components/ai/atlas/AtlasWelcome.tsx` | **Criar** - Tela de boas-vindas |
| `src/components/ai/atlas/AtlasInputBar.tsx` | **Criar** - Barra de input com ferramentas |
| `src/components/ai/atlas/AtlasMessageBubble.tsx` | **Criar** - Componente de mensagem |
| `src/components/layout/Sidebar.tsx` | **Modificar** - Adicionar botão Atlas Hub no topo |
| `src/components/layout/DashboardHeader.tsx` | **Modificar** - Remover botão Atlas Hub |
| `src/components/ai/FloatingAIChat.tsx` | **Modificar** - Refatorar para usar useAtlasChat |
| Rotas (App.tsx ou similar) | **Modificar** - Adicionar rota `/app/atlas-hub` |

### Detalhes Técnicos

- **Não instalar** `next`, `use-stick-to-bottom`, `ai` (dependências Next.js do componente de referência) - usar ScrollArea do Radix existente
- **Não copiar** os componentes UI fornecidos diretamente - são referência visual apenas (muitos são Next.js incompatíveis)
- **Usar** `motion/react` (já instalado) para animações de transição
- **Usar** `react-markdown` (já instalado) para renderização de mensagens
- **Usar** `react-resizable-panels` (já instalado) para o layout sidebar/chat colapsável

