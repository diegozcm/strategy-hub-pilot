

## Preparar o Atlas para Implementacoes via Metodo JSON

### Problema Atual
O Atlas consegue criar alguns itens (pilares, objetivos, KRs, iniciativas, projetos) e atualizar apenas KRs e iniciativas. Faltam acoes de edicao para objetivos, pilares e projetos, alem de operacoes de exclusao. Quando o Atlas tenta criar estruturas complexas, muitas vezes falha por falta de contexto (IDs reais) ou por limitacoes nos tipos de acao disponiveis.

### Solucao
Expandir o `ai-agent-execute` com novas acoes CRUD completas e adicionar um modo `bulk_import` que reutiliza a logica comprovada do `import-company-data` para operacoes complexas. Tambem melhorar o contexto enviado ao Atlas para que ele tenha acesso aos IDs reais dos recursos existentes.

### Alteracoes

**1. Novas acoes no `ai-agent-execute/index.ts`**

Adicionar os tipos de acao que faltam:
- `update_objective` - Atualizar titulo, descricao, target_date, weight, status de um objetivo existente (por ID ou titulo)
- `update_pillar` - Atualizar nome, cor, descricao de um pilar existente
- `update_project` - Atualizar nome, descricao, prioridade, datas, budget, status de um projeto
- `delete_objective` - Remover um objetivo (e seus KRs/iniciativas em cascata)
- `delete_key_result` - Remover um KR
- `delete_initiative` - Remover uma iniciativa
- `delete_pillar` - Remover um pilar (e seus objetivos em cascata)
- `delete_project` - Remover um projeto
- `bulk_import` - Aceitar um mini-JSON no formato de exportacao e processar via logica de importacao (merge mode)

Cada acao de update/delete aceita busca por ID ou por titulo (ilike).

**2. Acao `bulk_import` no `ai-agent-execute`**

Para operacoes complexas (ex: "importe toda a estrutura da empresa X"), o Atlas podera gerar um bloco com `type: "bulk_import"` contendo o JSON no formato identico ao da exportacao. O sistema chamara internamente a logica de importacao (merge mode) para processar o payload. Isso garante que campos JSONB como `monthly_targets` sejam preservados com 100% de fidelidade.

**3. Melhorar contexto do Atlas no `ai-chat/index.ts`**

Atualmente o Atlas ve apenas titulos e valores dos objetivos/KRs. Para poder editar/atualizar, ele precisa dos IDs. Alterar a query de contexto para incluir:
- IDs dos pilares, objetivos, KRs, projetos e iniciativas
- Status e progresso de cada item
- IDs dos KRs dentro de cada objetivo (para vinculos corretos)

Isso permite que o Atlas gere acoes como `update_objective` com o ID correto.

**4. Atualizar o system prompt do Atlas**

Adicionar documentacao dos novos tipos de acao no prompt do sistema para que o Atlas saiba que pode:
- Editar qualquer item existente (objetivo, pilar, KR, projeto, iniciativa)
- Excluir itens
- Fazer importacoes em massa via `bulk_import`

### Detalhes Tecnicos

**Novos tipos de acao no ai-agent-execute:**

```text
update_objective:
  - Campos: objective_id ou objective_title, title, description, target_date, weight, status
  
update_pillar:
  - Campos: pillar_id ou pillar_name, name, description, color

update_project:
  - Campos: project_id ou project_name, name, description, priority, start_date, end_date, budget, status

delete_objective:
  - Campos: objective_id ou objective_title

delete_key_result:
  - Campos: kr_id ou kr_title

delete_initiative:
  - Campos: initiative_id ou initiative_title

delete_pillar:
  - Campos: pillar_id ou pillar_name

delete_project:
  - Campos: project_id ou project_name

bulk_import:
  - Campos: data (JSON no formato de exportacao, sera processado em merge mode)
```

**Contexto melhorado no ai-chat (exemplo):**

```text
Pilares Estrategicos:
- Financeiro (id: abc-123) — 3 objetivos
- Clientes (id: def-456) — 2 objetivos

Objetivos:
- Aumentar receita (id: obj-789, pilar: Financeiro, progresso: 45%, status: in_progress)
  - KR: Receita mensal (id: kr-111, atual: 300000, meta: 500000)
  - KR: Margem de lucro (id: kr-222, atual: 18%, meta: 25%)
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/ai-agent-execute/index.ts` | Adicionar update_objective, update_pillar, update_project, delete_*, bulk_import |
| `supabase/functions/ai-chat/index.ts` | Incluir IDs no contexto da empresa e documentar novos tipos de acao no prompt |

### Sequencia de Implementacao

1. Expandir `ai-agent-execute` com as novas acoes CRUD e bulk_import
2. Atualizar contexto no `ai-chat` para incluir IDs dos recursos
3. Atualizar system prompt com documentacao das novas acoes
4. Deploy das edge functions e teste
