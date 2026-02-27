

# Plano: Sidebar com Sync em Tempo Real + Renomeação Automática de Sessões

## 1. Sincronização em Tempo Real da Sidebar

**Arquivo**: `src/hooks/useAtlasChat.ts`

Adicionar um `useEffect` dentro do hook que cria um canal Supabase Realtime escutando `ai_chat_sessions` filtrado por `user_id`. Quando houver INSERT, UPDATE ou DELETE na tabela, o callback atualiza o estado `sessions` diretamente:

- **INSERT**: Adiciona a nova sessão no topo da lista.
- **UPDATE**: Atualiza o título/timestamp da sessão existente na lista.
- **DELETE**: Remove a sessão da lista.

Isso elimina a necessidade de re-fetch manual — qualquer nova conversa aparece instantaneamente na sidebar.

## 2. Renomeação Automática pelo Atlas (IA)

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Após gerar a resposta da IA (na primeira ou segunda mensagem da sessão), a edge function fará uma chamada secundária leve à LLM pedindo um título curto (~5-8 palavras) que resuma o tema da conversa. O título gerado será salvo via `UPDATE ai_chat_sessions SET session_title = '...' WHERE id = session_id`.

Lógica de ativação:
- Só renomeia quando a contagem de mensagens no session for ≤ 3 (primeiras interações).
- O título atual ainda é o trecho inicial da mensagem do usuário (substring de 60 chars) — a IA vai substituir por algo mais semântico.

**Prompt de renomeação** (chamada rápida, ~50 tokens):
```
"Resuma esta conversa em um título curto (5-8 palavras, português). Responda APENAS o título, sem aspas."
```

## 3. Atualização do título refletida via Realtime

Como o passo 1 já escuta UPDATEs na tabela `ai_chat_sessions`, quando a edge function atualizar o título, a sidebar receberá o evento e mostrará o novo nome automaticamente — sem refresh.

## Arquivos Impactados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useAtlasChat.ts` | Canal Realtime para `ai_chat_sessions` |
| `supabase/functions/ai-chat/index.ts` | Lógica de auto-rename após primeiras mensagens |

