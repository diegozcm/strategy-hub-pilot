
# Investigacao Completa: Regras de Criacao de Itens Estrategicos para a IA

## Resumo do Problema

A IA (Atlas) nao tem instrucoes completas sobre os campos obrigatorios e relacionamentos de cada entidade estrategica. O backend (`ai-agent-execute`) tambem nao processa varios campos importantes que os formularios do frontend exigem. Isso causa falhas na criacao e dados incompletos.

---

## 1. Mapeamento Completo de Cada Entidade

### 1.1 Pilares Estrategicos (`strategic_pillars`)

| Campo | Obrigatorio | Tipo | Notas |
|-------|:-----------:|------|-------|
| name | Sim | string | Nome do pilar |
| description | Nao | string | Descricao do foco |
| color | Sim | string (hex) | Cor do pilar (ex: #22C55E) |
| company_id | Automatico | UUID | Preenchido pelo backend |
| order_index | Automatico | number | Preenchido pelo backend |

**Status no backend:** NAO SUPORTADO pelo `ai-agent-execute`. Nao existe action `create_pillar`.

**Acao:** Adicionar suporte a `create_pillar` no backend.

---

### 1.2 Objetivos Estrategicos (`strategic_objectives`)

| Campo | Obrigatorio | Tipo | Notas |
|-------|:-----------:|------|-------|
| title | Sim | string | Titulo do objetivo |
| description | Nao | string | Descricao |
| pillar_id | Sim | UUID | Resolvido via `pillar_name` no backend |
| plan_id | Automatico | UUID | Usa plano ativo |
| owner_id | Automatico | UUID | Usuario logado |
| target_date | Nao | date | Data meta |
| status | Automatico | string | Default: 'not_started' |
| weight | Nao | number | Peso 1-10, default 1 |
| progress | Automatico | number | Default: 0 |

**Status no backend:** Suportado. Falta campo `weight` na normalizacao.

**Acao:** Adicionar `weight` ao `normalizeObjectiveData` e ao insert.

---

### 1.3 Resultados-Chave / KRs (`key_results`)

| Campo | Obrigatorio | Tipo | Notas |
|-------|:-----------:|------|-------|
| title | Sim | string | Nome do KR |
| objective_id | Sim | UUID | Resolvido via `objective_ref` ou busca |
| target_value | Sim | number | Meta numerica |
| current_value | Nao | number | Default: 0 |
| unit | Sim | string | %, R$, un, dias, score, points |
| frequency | Nao | enum | monthly, bimonthly, quarterly, semesterly, yearly |
| weight | Nao | number | Peso 1-10, default 1 |
| description | Nao | string | Descricao |
| owner_id | Automatico | UUID | Usuario logado |
| monthly_targets | Nao | JSON | Metas por periodo: {"2026-01": 100, "2026-02": 150} |
| yearly_target | Nao | number | Meta anual |
| aggregation_type | Nao | enum | sum, average, max, min (default: sum) |
| comparison_type | Nao | enum | cumulative, period (default: cumulative) |
| target_direction | Nao | enum | maximize, minimize (default: maximize) |
| start_month | Nao | string | Vigencia inicio: "2026-01" |
| end_month | Nao | string | Vigencia fim: "2026-12" |
| assigned_owner_id | Nao | UUID | Dono do KR (diferente de owner_id) |

**Status no backend:** Faltam 5 campos criticos: `aggregation_type`, `comparison_type`, `target_direction`, `start_month`, `end_month`, `assigned_owner_id`.

**Acao:** Adicionar esses campos ao `normalizeKRData` e ao insert no backend.

---

### 1.4 Iniciativas (`kr_initiatives`)

| Campo | Obrigatorio | Tipo | Notas |
|-------|:-----------:|------|-------|
| title | Sim | string | Titulo da iniciativa |
| key_result_id | Sim | UUID | Resolvido via `key_result_ref` ou busca |
| company_id | Automatico | UUID | Empresa do usuario |
| description | Nao | string | Descricao |
| priority | Nao | enum | low, medium, high (default: medium) |
| start_date | Nao | date | Data inicio |
| end_date | Nao | date | Data fim |
| status | Automatico | enum | planned, in_progress, completed, cancelled, on_hold |
| progress_percentage | Nao | number | 0-100, default 0 |
| responsible | Nao | string | Nome do responsavel |
| budget | Nao | number | Orcamento |
| created_by | Automatico | UUID | Usuario logado |
| position | Automatico | number | Ordem de exibicao |

**Status no backend:** Faltam campos `responsible` e `budget`.

**Acao:** Adicionar `responsible` e `budget` ao `normalizeInitiativeData` e ao insert.

---

### 1.5 Projetos Estrategicos (`strategic_projects`)

| Campo | Obrigatorio | Tipo | Notas |
|-------|:-----------:|------|-------|
| name | Sim | string | Nome do projeto |
| plan_id | Sim | UUID | Plano estrategico ativo |
| company_id | Automatico | UUID | Empresa |
| owner_id | Automatico | UUID | Usuario logado |
| description | Nao | string | Descricao |
| priority | Nao | enum | low, medium, high |
| start_date | Nao | date | Data inicio |
| end_date | Nao | date | Data fim |
| budget | Nao | number | Orcamento |
| responsible_id | Nao | UUID | ID do responsavel |
| status | Automatico | string | Default: 'planning' |
| progress | Automatico | number | Default: 0 |

**Relacionamentos:**
- `project_objective_relations`: vincula projeto a objetivos (project_id + objective_id)
- `project_kr_relations`: vincula projeto a KRs (project_id + kr_id)

**Status no backend:** NAO SUPORTADO. Nao existe action `create_project`.

**Acao:** Adicionar suporte a `create_project` no backend, incluindo criacao de relacoes com objetivos e KRs.

---

## 2. Mudancas no Backend (`ai-agent-execute/index.ts`)

### 2.1 Atualizar `normalizeObjectiveData` - adicionar `weight`

```typescript
function normalizeObjectiveData(data: any) {
  return {
    title: data.title,
    description: data.description || null,
    pillar_name: data.pillar_name || data.pilar || data.pillar || data.perspective || null,
    target_date: data.target_date || data.deadline || data.due_date || null,
    weight: data.weight || 1,
  };
}
```

### 2.2 Atualizar `normalizeKRData` - adicionar campos faltantes

```typescript
function normalizeKRData(data: any) {
  return {
    // ... campos existentes ...
    aggregation_type: data.aggregation_type || 'sum',
    comparison_type: data.comparison_type || 'cumulative',
    target_direction: data.target_direction || 'maximize',
    start_month: data.start_month || null,
    end_month: data.end_month || null,
    assigned_owner_id: data.assigned_owner_id || null,
  };
}
```

### 2.3 Atualizar `normalizeInitiativeData` - adicionar campos faltantes

```typescript
function normalizeInitiativeData(data: any) {
  return {
    // ... campos existentes ...
    responsible: data.responsible || null,
    budget: data.budget ? parseFloat(data.budget) : null,
  };
}
```

### 2.4 Adicionar novo action type: `create_pillar`

- Inserir na tabela `strategic_pillars` com `company_id`, `name`, `color` (default #3B82F6), `description`, `order_index`.

### 2.5 Adicionar novo action type: `create_project`

- Inserir na tabela `strategic_projects` com `plan_id`, `company_id`, `owner_id`, `name`, `description`, `priority`, `start_date`, `end_date`, `budget`, `status: 'planning'`.
- Resolver objetivos vinculados via `objective_refs` (indices do array de actions) ou `objective_ids` (UUIDs diretos).
- Inserir relacoes na tabela `project_objective_relations`.
- Opcionalmente resolver KRs vinculados via `kr_refs` ou `kr_ids` e inserir em `project_kr_relations`.

### 2.6 Atualizar insert de KR para incluir novos campos

Apos construir `krData`, incluir:

```typescript
if (d.aggregation_type) krData.aggregation_type = d.aggregation_type;
if (d.comparison_type) krData.comparison_type = d.comparison_type;
if (d.target_direction) krData.target_direction = d.target_direction;
if (d.start_month) krData.start_month = d.start_month;
if (d.end_month) krData.end_month = d.end_month;
if (d.assigned_owner_id) krData.assigned_owner_id = d.assigned_owner_id;
```

### 2.7 Atualizar insert de Iniciativa para incluir novos campos

```typescript
responsible: d.responsible || null,
budget: d.budget ? parseFloat(String(d.budget)) : null,
```

### 2.8 Atualizar insert de Objetivo para incluir peso

```typescript
weight: d.weight || 1,
```

---

## 3. Mudancas no System Prompt (`ai-chat/index.ts`)

### 3.1 Atualizar o formato ATLAS_PLAN documentado

Substituir o formato de exemplo por um mais completo que inclua TODOS os campos e action types possiveis:

```
FORMATO CORRETO:
[ATLAS_PLAN]
{"actions": [
  {"type": "create_pillar", "data": {"name": "...", "color": "#HEX", "description": "..."}},
  {"type": "create_objective", "data": {"title": "...", "pillar_name": "NOME_EXATO_DO_PILAR", "description": "...", "target_date": "YYYY-MM-DD", "weight": 1}},
  {"type": "create_key_result", "data": {"title": "...", "objective_ref": 0, "target_value": 100, "unit": "%", "frequency": "monthly", "monthly_targets": {"2026-01": 10, "2026-02": 20}, "yearly_target": 100, "aggregation_type": "sum", "target_direction": "maximize", "start_month": "2026-01", "end_month": "2026-12", "weight": 1, "description": "..."}},
  {"type": "create_initiative", "data": {"title": "...", "key_result_ref": 1, "description": "...", "priority": "high", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "responsible": "Nome", "budget": 10000}},
  {"type": "create_project", "data": {"name": "...", "description": "...", "priority": "medium", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "budget": 50000, "objective_refs": [0]}}
]}
[/ATLAS_PLAN]
```

### 3.2 Adicionar referencia de campos validos no prompt

Documentar para a IA:

- **Unidades validas para KR**: `%`, `R$`, `un`, `dias`, `score`, `points`
- **Frequencias validas**: `monthly`, `bimonthly`, `quarterly`, `semesterly`, `yearly`
- **Tipos de agregacao**: `sum`, `average`, `max`, `min`
- **Direcao da meta**: `maximize`, `minimize`
- **Formato de monthly_targets**: `{"YYYY-MM": valor}` (ex: `{"2026-01": 100, "2026-02": 150}`)
- **Prioridades validas**: `low`, `medium`, `high`

---

## 4. Mudancas no Frontend (`FloatingAIChat.tsx`)

### 4.1 Atualizar `extractPlan` para normalizar novos action types

Adicionar normalizacao para `create_pillar` e `create_project`:

```typescript
.replace('create_strategic_pillar', 'create_pillar')
.replace('create_strategic_project', 'create_project')
```

### 4.2 Atualizar mensagem de sucesso para incluir novos tipos

Na mensagem de confirmacao, adicionar icones para pilares e projetos:

```typescript
r.type === 'create_pillar' ? '🏛️ Pilar' : 
r.type === 'create_project' ? '📂 Projeto' : ...
```

---

## Resumo dos Arquivos Alterados

| Arquivo | Mudancas |
|---------|---------|
| `supabase/functions/ai-agent-execute/index.ts` | Adicionar campos faltantes nos normalizers, novo `create_pillar`, novo `create_project`, campos extras no insert de KR/Iniciativa/Objetivo |
| `supabase/functions/ai-chat/index.ts` | Atualizar system prompt com formato completo e referencia de todos os campos validos |
| `src/components/ai/FloatingAIChat.tsx` | Normalizar novos action types e atualizar mensagem de sucesso |
