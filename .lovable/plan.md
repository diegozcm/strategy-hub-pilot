

## Plano Revisado: Painel de Consumo da IA Atlas — Versao Melhorada

### O que mudou em relacao ao plano anterior

Apos investigar mais a fundo a estrutura de dados e o admin existente, identifiquei **5 melhorias importantes** ao plano original:

---

### Melhoria 1: Tabela dedicada para custos por modelo (em vez de hardcoded)

O plano anterior usava constantes hardcoded para precos. O problema e que modelos mudam de preco com frequencia (o Google Gemini ja mudou 3 vezes em 2025). 

**Nova abordagem:** Criar uma tabela `ai_model_pricing` no banco com colunas:
- `model_name` (varchar, PK)
- `input_cost_per_million` (numeric)
- `output_cost_per_million` (numeric)
- `currency` (varchar, default 'USD')
- `updated_at` (timestamptz)

Isso permite que o admin atualize precos pela interface sem precisar de deploy. A pagina de Configuracoes de Custo vira um CRUD real sobre essa tabela, nao apenas uma tela visual.

---

### Melhoria 2: Rastrear execucoes do ai-agent-execute (modo Plan)

Hoje **so o chat** (`ai-chat`) registra analytics. O `ai-agent-execute` nao registra nada — ou seja, toda execucao de acao do Atlas (criar pilar, objetivo, KR, projeto, bulk_import) e invisivel no consumo.

Pior: o `ai-agent-execute` nao chama modelos de IA diretamente (ele recebe acoes ja decididas pelo `ai-chat`), entao nao tem `usage.prompt_tokens`. Porem, ele processa dados e faz mutacoes — o que deveria ser rastreado como `agent_execution` para medir:
- Quantas acoes foram executadas por empresa
- Quais tipos de acao (create_pillar, bulk_import, etc.)
- Sucesso vs falha
- Tempo de execucao

**Nova abordagem:** Registrar `event_type: 'agent_execution'` no `ai_analytics` apos cada acao no `ai-agent-execute`, com `event_data` contendo:
```
{ action_type, company_id, success, execution_time_ms, items_created (para bulk) }
```

Isso nao tem tokens de modelo, mas complementa o rastreamento mostrando o **impacto real** do Atlas.

---

### Melhoria 3: View SQL para agregar dados (em vez de queries complexas no frontend)

O plano anterior fazia agregacoes complexas (GROUP BY empresa, por dia, por modelo) direto no frontend usando queries Supabase. Isso e fragil e lento quando a tabela crescer.

**Nova abordagem:** Criar uma database view `ai_usage_summary` que pre-agrega os dados mais usados:

```sql
CREATE VIEW ai_usage_summary AS
SELECT 
  date_trunc('day', created_at) as day,
  event_data->>'company_id' as company_id,
  event_data->>'model_used' as model,
  event_type,
  COUNT(*) as call_count,
  SUM((event_data->>'prompt_tokens')::int) as total_prompt_tokens,
  SUM((event_data->>'completion_tokens')::int) as total_completion_tokens,
  SUM((event_data->>'total_tokens')::int) as total_tokens
FROM ai_analytics
GROUP BY 1, 2, 3, 4;
```

O hook no frontend simplesmente faz `SELECT * FROM ai_usage_summary` com filtros de data e empresa. Mais limpo e performante.

---

### Melhoria 4: Converter custo para BRL (Real)

O sistema e brasileiro. Mostrar custos so em USD nao e intuitivo. Adicionar uma coluna `usd_to_brl_rate` na tabela `ai_model_pricing` (ou uma config separada) e calcular o custo em ambas as moedas. O dashboard mostra em R$ por padrao, com USD entre parenteses.

---

### Melhoria 5: Alertas de consumo excessivo

Adicionar um sistema simples de thresholds: quando uma empresa ultrapassa X tokens/dia ou Y reais/mes, destacar na tabela com cor vermelha e opcionalmente registrar um alerta. Isso e util para identificar uso abusivo ou inesperado.

Implementacao: Comparar totais da view `ai_usage_summary` contra limites configurados na pagina de custo. Sem necessidade de cron — e calculado em tempo de renderizacao.

---

### Estrutura final de arquivos

```text
Novos arquivos:
├── src/components/admin-v2/pages/ai/
│   ├── AIUsageDashboardPage.tsx      (dashboard principal com KPIs + graficos)
│   ├── AIByCompanyPage.tsx           (consumo agrupado por empresa)
│   ├── AIByUserPage.tsx              (consumo agrupado por usuario)
│   ├── AISessionsPage.tsx            (historico de sessoes com mensagens)
│   └── AICostSettingsPage.tsx        (CRUD de precos por modelo + taxa USD/BRL)
├── src/hooks/admin/useAIUsageStats.ts (hook central: queries na view + calculo de custo)

Arquivos modificados:
├── src/components/admin-v2/config/sidebarContent.ts  (nova secao "IA Atlas")
├── src/components/admin-v2/pages/index.ts            (exports)
├── src/App.tsx                                        (rotas)
├── supabase/functions/ai-agent-execute/index.ts      (log de agent_execution)

Migracao SQL:
├── Tabela ai_model_pricing
├── View ai_usage_summary
├── Seed com precos atuais dos 3 modelos
```

### Pagina principal: AIUsageDashboardPage

```text
┌─────────────────────────────────────────────────────────────┐
│  IA Atlas — Consumo e Custos                                │
├────────┬────────┬────────┬────────┬────────┐                │
│ Total  │ Tokens │ Custo  │ Sessoes│ Acoes  │                │
│ Chama- │ Consu- │ Esti-  │ Ativas │ Execu- │                │
│ das    │ midos  │ mado   │        │ tadas  │                │
│  127   │ 1.2M   │ R$4.50 │   34   │   89   │                │
├────────┴────────┴────────┴────────┴────────┘                │
│                                                              │
│  [Grafico: Tokens por Dia - ultimos 30 dias]                │
│  ████ Prompt  ████ Completion                                │
│                                                              │
│  [Grafico: Distribuicao por Modelo]   [Top 5 Empresas]      │
│  ┌──────────┐                          1. Copapel: 45%      │
│  │  Pie     │                          2. Empresa B: 30%    │
│  │  Chart   │                          3. Empresa C: 15%    │
│  └──────────┘                          4. ...               │
│                                                              │
│  Ultimas chamadas (tabela)                                   │
│  | Hora | Usuario | Empresa | Modelo | Tokens | Custo (R$) |│
│  | ...  | ...     | ...     | ...    | ...    | ...        |│
└─────────────────────────────────────────────────────────────┘
```

O card "Acoes Executadas" e novo — vem dos registros `agent_execution` que serao adicionados ao `ai-agent-execute`.

### Sidebar: nova secao

Adicionar `{ id: "ai", icon: Sparkles, label: "IA Atlas" }` na `navItems` e `getSidebarContent`:

```text
IA Atlas
├── Visao Geral        → /app/admin/ai
├── Por Empresa        → /app/admin/ai/by-company
├── Por Usuario        → /app/admin/ai/by-user
├── Sessoes            → /app/admin/ai/sessions
└── Custos e Limites   → /app/admin/ai/costs
```

### Rastreamento no ai-agent-execute

Apos cada acao processada (linha onde `results.push(...)` acontece), inserir:

```typescript
await supabase.from('ai_analytics').insert({
  user_id,
  event_type: 'agent_execution',
  event_data: {
    company_id,
    action_type: action.action,      // "create_pillar", "bulk_import", etc.
    success: true,
    items_created: results.length,    // para bulk_import: contagem total
    execution_time_ms: Date.now() - startTime,
  }
});
```

### Ordem de implementacao sugerida

1. Migracao SQL (tabela `ai_model_pricing` + view `ai_usage_summary` + seed)
2. Tracking no `ai-agent-execute`
3. Hook `useAIUsageStats`
4. Sidebar + rotas
5. Dashboard principal (`AIUsageDashboardPage`)
6. Subpaginas (empresa, usuario, sessoes, custos)

