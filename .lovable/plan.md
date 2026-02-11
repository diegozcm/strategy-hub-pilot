
# Correcao Completa do Modulo IA Copilot

## Problemas Identificados

### 1. Insights mostrando "undefined" no titulo
**Causa raiz**: A edge function `generate-insights` busca `key_results` com o campo `title`, mas no codigo de analise rule-based (linhas 174-176, 411, 418, 419) referencia `indicator.name` -- campo que nao existe na tabela. O campo correto e `title`. Por isso todos os insights de KRs mostram `Meta Critica: "undefined"`.

### 2. Chat da IA dando erro sem mensagem
**Causa raiz**: Os logs mostram `AuthSessionMissingError: Auth session missing!`. A edge function `ai-chat` tenta validar o token do usuario criando um client Supabase com `SUPABASE_ANON_KEY` e passando o token no header. Porem, o metodo `supabaseClient.auth.getUser()` precisa do token no formato correto. O problema e que o `supabase.functions.invoke` ja envia o token automaticamente, mas a funcao tenta extrair e re-criar o client de forma incorreta. Vamos simplificar usando `supabaseClient.auth.getUser(token)` diretamente.

### 3. Tabelas erradas no generate-insights
**Causa raiz**: A funcao consulta `startup_profiles` e `mentor_sessions`, mas as tabelas reais se chamam `startup_hub_profiles` e `mentoring_sessions`. Isso faz com que os dados do Startup HUB nunca sejam carregados para analise.

### 4. CORS incompleto
**Causa raiz**: O `generate-insights` usa CORS inline sem os headers `x-supabase-client-platform*` e `x-supabase-client-runtime*`. O `_shared/cors.ts` tambem esta incompleto.

### 5. Modelo desatualizado
O sistema usa `google/gemini-2.5-flash`. O modelo padrao recomendado e `google/gemini-3-flash-preview`.

---

## Plano de Acao

### Etapa 1: Corrigir CORS compartilhado
**Arquivo**: `supabase/functions/_shared/cors.ts`
- Atualizar para incluir todos os headers necessarios (authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version)

### Etapa 2: Corrigir edge function `ai-chat`
**Arquivo**: `supabase/functions/ai-chat/index.ts`
- Corrigir autenticacao: usar `supabaseClient.auth.getUser(token)` passando o token diretamente em vez de confiar na sessao
- Atualizar modelo padrao para `google/gemini-3-flash-preview`
- Melhorar o system prompt para ser mais profissional e humanizado
- Aumentar max_tokens padrao para 2000

### Etapa 3: Corrigir edge function `generate-insights`
**Arquivo**: `supabase/functions/generate-insights/index.ts`
- Corrigir nomes das tabelas: `startup_profiles` para `startup_hub_profiles`, `mentor_sessions` para `mentoring_sessions`
- Corrigir campo `indicator.name` para `indicator.title` em todas as ocorrencias (analise rule-based)
- Atualizar CORS para usar o modulo compartilhado `_shared/cors.ts`
- Atualizar modelo para `google/gemini-3-flash-preview`
- Corrigir mapeamento `kr.name` para `kr.title` no contextData

### Etapa 4: Melhorar tratamento de erro no frontend
**Arquivo**: `src/components/ai/FloatingAIChat.tsx`
- Tratar erros 429 e 402 com mensagens amigaveis
- Garantir que erros de rede mostrem toast com mensagem clara
- Usar `FunctionsHttpError` para capturar respostas nao-2xx corretamente

**Arquivo**: `src/components/ai/AICopilotPage.tsx`
- Mesmo tratamento de erros para a geracao de insights

### Etapa 5: Deploy e teste
- Deploy das duas edge functions
- Testar chat enviando mensagem
- Testar geracao de insights

---

## Detalhes Tecnicos

### Correcao do campo `name` para `title` no generate-insights

O select ja busca `title`:
```text
.select('id, title, current_value, target_value, unit, due_date, priority, objective_id')
```

Mas o mapeamento usa `kr.name`:
```text
name: kr.name  -->  deve ser  name: kr.title
```

E a analise rule-based usa `indicator.name`:
```text
indicator.name  -->  deve ser  indicator.title
```

Isso afeta aproximadamente 15 ocorrencias no arquivo.

### Correcao da autenticacao no ai-chat

De:
```text
const { data: { user }, error } = await supabaseClient.auth.getUser();
```

Para:
```text
const { data: { user }, error } = await supabaseClient.auth.getUser(token);
```

Isso permite validar o token sem depender de uma sessao ativa no servidor.

### Arquivos a serem editados
1. `supabase/functions/_shared/cors.ts`
2. `supabase/functions/ai-chat/index.ts`
3. `supabase/functions/generate-insights/index.ts`
4. `src/components/ai/FloatingAIChat.tsx`
5. `src/components/ai/AICopilotPage.tsx`
