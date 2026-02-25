

## Diagnostico Completo — IA Atlas Admin Dashboard

### Problemas encontrados (raiz)

**1. Carregamento infinito na Visao Geral**

A tabela `ai_model_pricing` tem **policies duplicadas** — as antigas quebradas (`is_system_admin()` sem argumento) nunca foram removidas. Existem DUAS policies de SELECT:
- `System admins can read pricing` → `is_system_admin()` (QUEBRADA — causa erro SQL)
- `System admins can view model pricing` → `is_system_admin(auth.uid())` (correta)

Quando o PostgreSQL avalia as policies com OR, a policy quebrada gera erro e a query inteira falha. O hook retorna `[]` silenciosamente, mas o `isLoading` pode travar dependendo de como o React Query trata a falha. Resultado: spinner infinito.

Mesmo problema nas policies de INSERT, UPDATE e DELETE — duplicatas com e sem `auth.uid()`.

**2. ai_chat_sessions sem policy de admin**

A tabela `ai_chat_sessions` so tem policies que filtram por `auth.uid() = user_id AND company_id`. O admin so ve suas proprias sessoes, nao as de todos os usuarios. O hook `useAIChatSessions` retorna apenas sessoes do admin logado.

**3. Por Empresa so mostra empresas com registros em ai_analytics**

O codigo atual agrupa dados de `ai_analytics` por `company_id` do `event_data`. So aparecem empresas que JA tiveram chamadas registradas. Empresas com `ai_enabled = true` mas sem uso (Copapel, Empresa copia, Gest Life, Nexo) nao aparecem.

Deveria listar TODAS as empresas com `ai_enabled = true` e mostrar 0 para as sem consumo.

**4. Por Usuario so mostra 1 usuario**

O `ai_analytics` so tem registros do usuario Bernardo (e0509600). Porem, existem 5 usuarios que usaram o chat:
- Bernardo Bruschi: 25 sessoes
- Leonardo Colin: 4 sessoes
- Diego Zagonel: 2 sessoes
- Francine Ferreira: 1 sessao
- User Test: 1 sessao

O problema: o edge function `ai-chat` registra analytics, mas o registro so funciona quando a chamada ao AI Gateway tem sucesso E retorna `usage` (tokens). Se a chamada falhar ou se o `ai-chat` foi modificado apos essas sessoes serem criadas, nao ha registro.

A solucao e tambem contar dados de `ai_chat_sessions` + `ai_chat_messages` como fonte complementar.

**5. Precos na tabela ai_model_pricing estao errados**

Valores atuais vs valores reais (fonte: Google, fev/2026):

| Modelo | Input atual | Input real | Output atual | Output real |
|---|---|---|---|---|
| gemini-3-flash-preview | $0.10 | $0.50 | $0.40 | $3.00 |
| gemini-2.5-pro | $1.25 | $1.25 | $10.00 | $10.00 |
| gemini-2.5-flash | $0.15 | $0.30 | $0.60 | $2.50 |

Dois dos tres modelos estao com precos subestimados em 5-7x. Todos os custos calculados estao errados.

**6. Custos e Limites — usuario quer atualizacao automatica**

O usuario quer que os precos e a taxa de cambio sejam atualizados automaticamente (pelo menos diariamente), mantendo historico de precos por data. Quando o preco muda, os registros antigos continuam calculados com o preco da epoca.

---

### Plano de Implementacao

#### Fase 1: SQL Migration — Corrigir RLS e estrutura

**1a. Remover policies duplicadas quebradas de `ai_model_pricing`:**
```
DROP POLICY "System admins can read pricing"
DROP POLICY "System admins can insert pricing"
DROP POLICY "System admins can update pricing"
DROP POLICY "System admins can delete pricing"
```
Manter apenas as policies corretas com `auth.uid()`.

**1b. Adicionar policy de admin em `ai_chat_sessions`:**
```sql
CREATE POLICY "System admins can view all chat sessions"
  ON ai_chat_sessions FOR SELECT
  USING (public.is_system_admin(auth.uid()));
```

**1c. Adicionar coluna de historico de precos em `ai_model_pricing`:**
Adicionar campo `effective_from` (date) para rastrear quando o preco entrou em vigor. Criar tabela `ai_pricing_history` para armazenar precos historicos:
```sql
CREATE TABLE ai_pricing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  input_cost_per_million numeric NOT NULL,
  output_cost_per_million numeric NOT NULL,
  usd_to_brl_rate numeric NOT NULL,
  effective_from date NOT NULL,
  effective_until date,
  source text, -- 'manual', 'auto_google', 'auto_exchange'
  created_at timestamptz DEFAULT now()
);
```
Com RLS para system admins.

**1d. Corrigir precos atuais:**
```sql
UPDATE ai_model_pricing SET input_cost_per_million = 0.50, output_cost_per_million = 3.00
  WHERE model_name = 'google/gemini-3-flash-preview';
UPDATE ai_model_pricing SET input_cost_per_million = 0.30, output_cost_per_million = 2.50
  WHERE model_name = 'google/gemini-2.5-flash';
```

**1e. Adicionar tabela de limites:**
```sql
CREATE TABLE ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('company', 'user')),
  target_id uuid NOT NULL,
  max_tokens_per_month bigint,
  max_cost_brl_per_month numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Fase 2: Edge Function — Atualizacao automatica de precos

Criar edge function `update-ai-pricing` que:
1. Busca a taxa USD/BRL de uma API publica gratuita (ex: `https://economia.awesomeapi.com.br/json/last/USD-BRL`)
2. Atualiza `ai_model_pricing.usd_to_brl_rate` para todos os modelos
3. Registra o preco anterior em `ai_pricing_history` antes de atualizar
4. Pode ser chamada manualmente ou via cron (pg_cron diario)

Os precos dos modelos Google sao mais estaveis (mudam a cada poucos meses). A taxa de cambio muda diariamente. Entao:
- Taxa de cambio: atualizada diariamente via cron
- Precos dos modelos: atualizados manualmente quando Google anuncia mudancas (com opcao de override manual na UI)

#### Fase 3: Frontend — Reescrever as 5 paginas

**3a. `useAIUsageStats.ts` — Melhorar hooks:**
- `useCompaniesMap()`: ja retorna `CompanyInfo` com `ai_enabled` (OK)
- `useAIChatSessions()`: remover limite de 100, buscar todas (admin precisa ver tudo)
- Adicionar `useAIChatMessagesCount()`: buscar contagem de mensagens por sessao
- `calculateCost()`: aceitar data do evento para buscar preco historico correspondente

**3b. `AIUsageDashboardPage.tsx` — Visao Geral:**
- Combinar TODOS os `isLoading` e `isError` dos hooks
- KPIs: Chamadas (de `ai_analytics`), Sessoes Ativas (de `ai_chat_sessions`), Tokens totais, Custo total (R$), Usuarios ativos
- Grafico de timeline: tokens por dia
- Grafico de pizza: distribuicao por modelo
- Top 5 empresas (apenas `ai_enabled = true`)
- Tabela de chamadas recentes

**3c. `AIByCompanyPage.tsx` — Por Empresa:**
- Listar TODAS empresas com `ai_enabled = true` (de `companies`, nao de `ai_analytics`)
- Para cada empresa: buscar sessoes de `ai_chat_sessions` + dados de `ai_analytics`
- Colunas: Empresa, IA Ativa (icone), Sessoes, Mensagens, Tokens, Custo (R$), Ultima atividade
- Toggle "Mostrar todas" para incluir empresas sem IA

**3d. `AIByUserPage.tsx` — Por Usuario:**
- Combinar dados de `ai_analytics` (tokens/custo) com `ai_chat_sessions` (sessoes/mensagens)
- Resolver nomes via `profiles` quando `user_name` esta null
- Colunas: Usuario, Empresas (lista), Sessoes, Mensagens, Tokens, Custo (R$)
- Mostrar TODOS os usuarios que usaram a IA, nao so os com registros em `ai_analytics`

**3e. `AISessionsPage.tsx` — Sessoes:**
- Precisa da policy de admin para ver todas as sessoes
- Cruzar com `ai_analytics` via `session_id` no `event_data` para tokens/custo
- Colunas: Titulo, Usuario, Empresa, Mensagens, Tokens, Custo (R$), Criada em, Ultima atividade

**3f. `AICostSettingsPage.tsx` — Custos e Limites:**
- Separar em 2 secoes: "Precos por Modelo" e "Limites de Uso"
- Precos: tabela editavel (como ja esta) + botao "Atualizar Cambio" que chama o edge function
- Switch "Atualizacao automatica de cambio" (ativa/desativa o cron)
- Mostrar historico de precos (ultimas 10 alteracoes)
- Limites: tabela com empresas e usuarios, permitindo definir `max_tokens_per_month` e `max_cost_brl_per_month`

#### Fase 4: Tracking — Garantir que toda chamada de IA seja registrada

O edge function `ai-chat` JA registra analytics corretamente (linhas 700-720). O problema e que sessoes antigas (antes do tracking ser adicionado) nao tem registros. Para esses casos, a contagem de mensagens via `ai_chat_messages` serve como proxy.

Verificar se o `ai-agent-execute` tambem registra corretamente (ja faz, linhas 1650-1652).

---

### Resumo dos arquivos afetados

| Arquivo | Acao |
|---|---|
| Nova migracao SQL | Remover policies duplicadas, adicionar admin policy em sessions, criar tabelas `ai_pricing_history` e `ai_usage_limits`, corrigir precos |
| `supabase/functions/update-ai-pricing/index.ts` | NOVO — Edge function para atualizar taxa de cambio via API publica |
| `src/hooks/admin/useAIUsageStats.ts` | Melhorar hooks, adicionar suporte a historico de precos |
| `src/components/admin-v2/pages/ai/AIUsageDashboardPage.tsx` | Reescrever com tratamento correto de loading/error/empty |
| `src/components/admin-v2/pages/ai/AIByCompanyPage.tsx` | Listar TODAS empresas com ai_enabled, nao so as com analytics |
| `src/components/admin-v2/pages/ai/AIByUserPage.tsx` | Combinar ai_analytics + ai_chat_sessions para dados completos |
| `src/components/admin-v2/pages/ai/AISessionsPage.tsx` | Depende da nova RLS policy. Adicionar tokens/custo por sessao |
| `src/components/admin-v2/pages/ai/AICostSettingsPage.tsx` | Adicionar secao de limites, historico de precos, botao de atualizar cambio |

### Ordem de execucao

1. SQL Migration (prerequisito para tudo funcionar)
2. Edge function `update-ai-pricing` + deploy
3. Reescrever `useAIUsageStats.ts`
4. Reescrever as 5 paginas do dashboard
5. Configurar cron para atualizacao diaria de cambio

