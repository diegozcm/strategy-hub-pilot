

# Plano: Integração de Insights ao Atlas Hub

## Visão Geral

Transformar o Atlas Hub em um hub unificado onde o chat e os insights coexistem. Ao clicar em "Insights" na sidebar, o painel principal muda de modo chat para modo insights -- tudo dentro da mesma página `/app/atlas-hub`, mantendo a sidebar intacta.

## Arquitetura de Modos

```text
┌─────────────────────────────────────────────────────┐
│                   Atlas Hub Page                     │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │   mode === 'chat'  →  AtlasChatArea      │
│          │   mode === 'insights' → InsightsPanel     │
│ ──────── │                                          │
│ [+ Nova] │   InsightsPanel:                         │
│ [Insights│   ┌─ Header com stats + "Gerar"          │
│ [Sessão1]│   ├─ Filtros (tipo/severidade)           │
│ [Sessão2]│   ├─ Lista de cards de insights          │
│          │   ├─ Aba "Histórico" (confirmados)       │
│          │   └─ InputBar adaptado p/ insights       │
│          │      "Pergunte sobre seus insights..."    │
└──────────┴──────────────────────────────────────────┘
```

## Etapas de Implementação

### 1. Adicionar estado de modo ao AtlasHubPage
- Criar estado `viewMode: 'chat' | 'insights'` no `AtlasHubPage.tsx`.
- O botão "Insights" na sidebar alterna para `viewMode = 'insights'` em vez de navegar para `/app/ai-copilot`.
- "Nova conversa" e seleção de sessão voltam para `viewMode = 'chat'`.

### 2. Criar componente `AtlasInsightsPanel`
Novo componente `src/components/ai/atlas/AtlasInsightsPanel.tsx` que exibe os insights dentro do Atlas Hub. Conteúdo:

- **Header compacto**: KPIs em linha (Insights Ativos, Alertas Críticos, Confiança Média) + botões "Gerar Insights" e "Limpar".
- **Filtros**: Pills/chips horizontais para tipo (Risco, Oportunidade, Info) e severidade (Crítico, Alto, Médio, Baixo).
- **Grid/Lista de cards**: Reutilizar o design de cards do `AICopilotPage` (avatar Atlas, tipo, severidade, descrição, recomendações, ações Confirmar/Descartar).
- **Tabs**: "Ativos" e "Histórico" para insights confirmados/descartados.
- Utilizar o hook `useAIInsights` existente para dados e ações.

### 3. Integrar InputBar contextual no modo Insights
- No modo insights, exibir o `AtlasInputBar` na parte inferior com placeholder adaptado: "Pergunte sobre seus insights ou peça uma análise...".
- Quando o usuário envia uma mensagem no modo insights, mudar automaticamente para modo chat com a mensagem pré-preenchida, permitindo que o Atlas responda sobre os insights.
- Alternativamente, manter o chat ativo abaixo/ao lado dos insights para interação direta.

### 4. Capacitar o Atlas a interagir com Insights via chat
- Adicionar ao system prompt do Atlas (na edge function `atlas-chat`) o contexto dos insights atuais da empresa (resumo de insights ativos, críticos, pendentes).
- O Atlas poderá:
  - **Gerar insights**: Invocar `generate-insights` quando solicitado pelo usuário no chat.
  - **Listar insights**: Responder com os insights já gerados consultando o contexto.
  - **Confirmar/Descartar**: Executar via `[ATLAS_PLAN]` com novas ações `confirm_insight` e `dismiss_insight`.
  - **Criar insights manuais**: Nova ação `create_insight` no plano.

### 5. Atualizar a Sidebar
- Modificar `AtlasSidebar.tsx`: o botão "Insights" recebe `onShowInsights` que alterna o modo em vez de navegar.
- Adicionar indicador visual (badge com contagem de insights ativos) no botão "Insights".
- Highlight visual quando `viewMode === 'insights'` (fundo ativo no botão).

### 6. Novas ações no `[ATLAS_PLAN]`
Adicionar ao executor de planos (`useAtlasChat.ts`) suporte para:
- `generate_insights` — chama a edge function.
- `confirm_insight` — marca insight como acknowledged.
- `dismiss_insight` — marca insight como dismissed.
- `create_insight` — insere um insight manual na tabela `ai_insights`.

### 7. Contexto de Insights no System Prompt
Na edge function `atlas-chat`, incluir na seção de contexto:
- Contagem de insights ativos por tipo e severidade.
- Lista resumida dos 5 insights mais recentes/críticos.
- Instruir o Atlas a oferecer análise quando relevante.

## Design Visual (Profissional)

- **InsightsPanel** usa o mesmo `atlas-chat-bg` do chat para consistência.
- Cards com bordas coloridas por severidade (vermelho/laranja/amarelo/verde).
- Animações suaves com `motion` (fade-in dos cards).
- Stats em cards compactos com ícones da marca COFOUND (azul/verde).
- Transição suave entre modos chat ↔ insights (fade/slide).

## Arquivos Impactados

| Arquivo | Mudança |
|---------|---------|
| `AtlasHubPage.tsx` | Estado `viewMode`, renderização condicional |
| `AtlasSidebar.tsx` | Botão Insights alterna modo, badge de contagem |
| `AtlasInsightsPanel.tsx` | **Novo** — painel de insights completo |
| `useAtlasChat.ts` | Novas ações de plano (insights) |
| `useAIInsights.tsx` | Possíveis ajustes para expor mais dados |
| Edge function `atlas-chat` | Contexto de insights no system prompt |

