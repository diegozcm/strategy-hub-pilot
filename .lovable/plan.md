

## Diagnostico Completo e Plano de Correcoes

### Investigacao dos dados reais

Consultei diretamente o banco de dados e encontrei os seguintes fatos:

**Tabela `ai_analytics`** — 12 registros totais, TODOS do mesmo usuario (Bernardo Bruschi):
- 5 registros com `company_id = 6a742099` (COFOUND) — fev/2026
- 7 registros com `company_id = a154142b` (Perville) — nov/2025

**Tabela `companies`** — campo `ai_enabled`:
- COFOUND: `ai_enabled = true`
- Perville: `ai_enabled = false` (mas tem dados antigos de analytics)
- Copapel [Free]: `ai_enabled = true`
- Empresa copia de testes: `ai_enabled = true`
- Gest Life: `ai_enabled = true`
- Nexo: `ai_enabled = true`

**Tabela `ai_model_pricing`** — 3 modelos com precos corretos

**Tabela `ai_chat_sessions`** — 10+ sessoes, a maioria na empresa "Empresa copia de testes" (b937342e), com 2 usuarios diferentes (Bernardo e outro user 9fafdbc8)

---

### Problema 1: Dashboard "Visao Geral" carregando infinito

**Causa raiz**: A query de `ai_model_pricing` nao aparece nos logs de rede — ela provavelmente falha antes de retornar. Mesmo com a migracao de RLS aplicada, o hook `useModelPricing` usa `retry: 1` e retorna `[]` em caso de erro, fazendo `isError` ficar `false`. Porem, se o `isLoading` de alguma das 3 queries (analytics, pricing, companiesMap) nunca resolve, o spinner fica infinito.

**Correcao**: O dashboard depende de 3 hooks: `useAIAnalyticsRaw`, `useModelPricing`, `useCompaniesMap`. O `isLoading` so verifica o primeiro. Se `useModelPricing` ou `useCompaniesMap` ficarem pendentes, o `useMemo` roda com dados vazios mas o render nao trava — o problema e que provavelmente o `useCompaniesMap` ou `useModelPricing` estao travando.

**Acao**: Verificar TODOS os 3 estados de loading/error e tratar cada um. Adicionar `isLoading` combinado dos 3 hooks. Adicionar estado de "sem dados" quando analytics retorna vazio.

---

### Problema 2: "Por Empresa" mostra empresas sem IA (Perville)

**Causa raiz**: A pagina busca `ai_analytics` e agrupa por `company_id` do `event_data`, sem verificar se a empresa tem `ai_enabled = true`. Perville aparece porque tem 7 registros antigos.

**Correcao**: Cruzar com a tabela `companies` para:
1. Adicionar coluna "IA Ativa" na tabela (icone verde/vermelho)
2. Filtrar por padrao apenas empresas com `ai_enabled = true`
3. Permitir toggle para ver todas (incluindo historico)

---

### Problema 3: "Por Usuario" mostra so 1 usuario

**Realidade dos dados**: Atualmente so existe 1 usuario com registros em `ai_analytics` (Bernardo). Porem, existem sessoes de chat (`ai_chat_sessions`) de pelo menos 2 usuarios. O problema e que o `ai-chat` edge function nao registrou analytics para todas as sessoes — possivelmente o tracking de analytics so foi adicionado depois.

**Correcao**: 
1. Combinar dados de `ai_analytics` com `ai_chat_sessions` para pegar usuarios que usaram o chat mas nao tiveram analytics registrado
2. Buscar `user_name` do perfil quando o campo esta null no event_data (7 registros antigos nao tem `user_name`)
3. Adicionar coluna de empresa com `ai_enabled` status

---

### Problema 4: "Sessoes" falta informacao de tokens e custo

**Causa raiz**: A pagina de sessoes so mostra titulo, empresa, contagem de mensagens, e datas. Nao calcula tokens nem custo.

**Correcao**: Para cada sessao, buscar os registros de `ai_analytics` que tem o mesmo `session_id` (campo em `event_data`) e somar tokens/custo. Adicionar colunas:
- Tokens consumidos
- Custo estimado (R$)

---

### Plano de implementacao

**Arquivo 1: `src/hooks/admin/useAIUsageStats.ts`**
- Adicionar hook `useCompaniesWithAI()` que busca empresas com `ai_enabled` para cruzamento
- Melhorar `useCompaniesMap()` para incluir campo `ai_enabled`
- Adicionar hook `useProfilesMap()` para buscar nomes de usuarios quando `user_name` estiver null no event_data

**Arquivo 2: `src/components/admin-v2/pages/ai/AIUsageDashboardPage.tsx`**
- Combinar `isLoading` dos 3 hooks (analytics + pricing + companies)
- Combinar `isError` dos 3 hooks
- Adicionar estado vazio quando nao ha dados
- Filtrar analytics apenas de empresas com `ai_enabled = true` por padrao
- Ajustar calculos de KPIs

**Arquivo 3: `src/components/admin-v2/pages/ai/AIByCompanyPage.tsx`**
- Buscar campo `ai_enabled` de cada empresa
- Adicionar coluna com indicador visual (icone) de IA ativa/inativa
- Filtro para mostrar somente empresas com IA ativa (padrao) ou todas

**Arquivo 4: `src/components/admin-v2/pages/ai/AIByUserPage.tsx`**
- Buscar nomes de usuario de `profiles` quando `user_name` esta null
- Cruzar com empresas para mostrar status de IA

**Arquivo 5: `src/components/admin-v2/pages/ai/AISessionsPage.tsx`**
- Buscar dados de `ai_analytics` por `session_id` para cada sessao
- Calcular e mostrar tokens totais e custo (R$) por sessao
- Adicionar colunas "Tokens" e "Custo (R$)"

### Detalhe tecnico

O cruzamento entre sessoes e analytics funciona assim: `ai_analytics.event_data->>'session_id'` = `ai_chat_sessions.id`. Cada sessao pode ter multiplos registros de analytics (1 por mensagem que gerou completion).

O `useCompaniesMap` atual retorna `Record<string, string>` (id -> name). Sera alterado para `Record<string, { name: string; ai_enabled: boolean }>` para que todas as paginas possam exibir o status de IA.

