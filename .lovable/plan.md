

## Diagnostico: Por que o tracking de IA esta quebrado

### Fatos encontrados no codigo

**3 edge functions usam IA no Strategy:**

| Edge Function | Modelo | Loga em `ai_analytics`? | Problema |
|---|---|---|---|
| `ai-chat` (streaming) | gemini-3-flash / 2.5-pro | NAO | Linha 653: retorna `aiResponse.body` diretamente e NUNCA chega ao codigo de logging na linha 700 |
| `ai-chat` (non-streaming) | gemini-3-flash / 2.5-pro | SIM | Unico modo que funciona — mas o app usa streaming por padrao |
| `generate-insights` | gemini-3-flash-preview | NAO | Zero logging. Faz chamada AI (linha 418) mas nunca insere em `ai_analytics` |
| `transcribe-audio` | gemini-2.5-flash | NAO | Zero logging. Nenhum registro de transcricao |
| `ai-agent-execute` | — (nao chama IA diretamente) | SIM | Loga acoes executadas (bulk_import etc), funciona |

**Resultado real:**
- 144 mensagens de chat em 33 sessoes, 5 usuarios, 5 empresas
- Apenas **12 registros** em `ai_analytics` — todos de 1 usuario (Bernardo), todos de non-streaming
- Dashboard mostra "5 Chamadas" quando deveria mostrar 60+ (cada mensagem assistant = 1 chamada AI)
- Custo mostra R$ 0.07 quando o real e provavelmente 10-50x mais

### Causa raiz

O `ai-chat` edge function tem dois caminhos:
1. **Streaming** (linha 624-660): Faz fetch ao gateway, e na linha 653 retorna `new Response(aiResponse.body, ...)` — o codigo TERMINA AQUI. As linhas 700-720 que fazem `await supabase.from('ai_analytics').insert(...)` NUNCA sao executadas.
2. **Non-streaming** (linha 663-720): Espera a resposta completa, extrai tokens do `usage`, e AI loga corretamente.

O frontend envia `stream: true` por padrao. Entao ~95% das chamadas nao sao rastreadas.

Alem disso, `generate-insights` e `transcribe-audio` simplesmente nao tem nenhum codigo de logging.

---

### Plano de Implementacao

#### Fase 1: Corrigir o tracking em `ai-chat` (streaming)

No modo streaming, nao temos `usage` (tokens) no body porque o stream e passado direto. A solucao:

1. Em vez de retornar `aiResponse.body` diretamente, consumir o stream no edge function
2. Parsear cada chunk SSE para extrair o conteudo
3. Ao receber `[DONE]`, pegar o ultimo chunk que contem `usage` (o gateway Lovable inclui usage no ultimo chunk de streaming)
4. Fazer o insert em `ai_analytics` com os tokens reais
5. Usar um `TransformStream` para re-emitir os chunks ao cliente enquanto processa

Campos padrao do registro:
```json
{
  "user_id": "uuid",
  "event_type": "chat_completion",
  "event_data": {
    "company_id": "uuid",
    "session_id": "uuid",
    "model_used": "google/gemini-3-flash-preview",
    "user_name": "Bernardo Bruschi",
    "prompt_tokens": 1234,
    "completion_tokens": 567,
    "total_tokens": 1801,
    "source": "ai-chat",
    "stream": true,
    "history_messages_count": 5,
    "context_summary": {...}
  }
}
```

#### Fase 2: Adicionar tracking em `generate-insights`

Apos a chamada AI (linha 418), inserir registro:
```json
{
  "event_type": "chat_completion",
  "event_data": {
    "source": "generate-insights",
    "company_id": "uuid",
    "model_used": "google/gemini-3-flash-preview",
    "prompt_tokens": N,
    "completion_tokens": N,
    "total_tokens": N,
    "insights_generated": N
  }
}
```

#### Fase 3: Adicionar tracking em `transcribe-audio`

Mesmo padrao. Essa funcao nao recebe `user_id` nem `company_id` no request body, entao precisa extrair do token JWT ou receber como parametro. Ajuste:
- Receber `user_id` e `company_id` no body (o frontend ja pode enviar)
- Ou extrair do JWT usando `supabase.auth.getUser()`

```json
{
  "event_type": "chat_completion",
  "event_data": {
    "source": "transcribe-audio",
    "model_used": "google/gemini-2.5-flash",
    "prompt_tokens": N,
    "completion_tokens": N,
    "total_tokens": N
  }
}
```

#### Fase 4: Padronizar o campo `event_data`

Todos os registros terao obrigatoriamente:
- `source`: identificador da edge function (`ai-chat`, `generate-insights`, `transcribe-audio`, `ai-agent-execute`)
- `company_id`: uuid da empresa
- `model_used`: modelo completo (ex: `google/gemini-3-flash-preview`)
- `user_name`: nome do usuario
- `prompt_tokens`, `completion_tokens`, `total_tokens`: contagem de tokens
- `session_id`: quando aplicavel (chat)

#### Fase 5: Reescrever o dashboard

Com o tracking padronizado, as 5 paginas do dashboard passam a funcionar corretamente:
- **Visao Geral**: KPIs reais com dados de todas as fontes (chat + insights + transcricao)
- **Por Empresa**: Todas empresas com `ai_enabled = true`, consumo real
- **Por Usuario**: Todos usuarios com sessoes OU analytics, nomes resolvidos
- **Sessoes**: Cada sessao com tokens/custo calculados dos registros de analytics vinculados
- **Custos e Limites**: Valores reais baseados no tracking correto

Nenhuma alteracao de banco de dados necessaria — a tabela `ai_analytics` ja tem a estrutura correta (`user_id`, `event_type`, `event_data` JSONB, `created_at`). O problema e exclusivamente que os edge functions nao estao inserindo dados.

#### Arquivos afetados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/ai-chat/index.ts` | Interceptar stream para extrair usage e logar antes de fechar |
| `supabase/functions/generate-insights/index.ts` | Adicionar insert em `ai_analytics` apos chamada AI |
| `supabase/functions/transcribe-audio/index.ts` | Adicionar auth, receber user/company, logar analytics |
| `src/components/admin-v2/pages/ai/AIUsageDashboardPage.tsx` | Ajustar para incluir dados de todas as sources |
| `src/components/admin-v2/pages/ai/AIByCompanyPage.tsx` | Sem alteracao de logica (ja funciona se os dados existirem) |
| `src/components/admin-v2/pages/ai/AIByUserPage.tsx` | Sem alteracao de logica |
| `src/components/admin-v2/pages/ai/AISessionsPage.tsx` | Sem alteracao de logica |

#### Ordem de execucao

1. Corrigir `ai-chat` streaming (maior impacto — 95% das chamadas)
2. Adicionar tracking em `generate-insights`
3. Adicionar tracking em `transcribe-audio`
4. Deploy das 3 edge functions
5. Ajustar frontend do dashboard para exibir dados por source

