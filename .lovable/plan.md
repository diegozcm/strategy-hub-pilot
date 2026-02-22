

## Expandir o Atlas para gerenciar todas as ferramentas da empresa

### Problema
O Atlas so consegue executar acoes no planejamento estrategico (pilares, objetivos, KRs, iniciativas, projetos, FCAs). Quando o usuario pede para criar uma reuniao de governanca, o Atlas gera `create_meeting` mas o executor retorna "Tipo de acao desconhecido".

### Solucao
Adicionar handlers para **Governanca RMRE**, **Golden Circle**, **SWOT** e **Alinhamento de Visao** no executor e documentar no prompt do Atlas.

### Novas acoes a implementar

**Governanca - Reunioes:**
- `create_meeting` — Cria reuniao de governanca (title, meeting_type [RM/RE/Extraordinaria], scheduled_date, scheduled_time, duration_minutes, location, notes)
- `update_meeting` — Atualiza reuniao existente por ID ou titulo
- `delete_meeting` — Remove reuniao e seus itens de pauta/atas em cascata

**Governanca - Itens de Pauta:**
- `create_agenda_item` — Cria item de pauta vinculado a uma reuniao (meeting_id ou meeting_title, title, description)

**Golden Circle:**
- `update_golden_circle` — Atualiza os campos why_question, how_question, what_question (upsert - cria se nao existe)

**SWOT:**
- `update_swot` — Atualiza strengths, weaknesses, opportunities, threats (upsert)

**Alinhamento de Visao:**
- `update_vision_alignment` — Atualiza shared_objectives, shared_commitments, shared_resources, shared_risks (upsert)

### Detalhes Tecnicos

**Arquivo 1: `supabase/functions/ai-agent-execute/index.ts`**

Antes do bloco `else` final (linha 1031), adicionar os novos handlers:

```text
create_meeting:
  - Insere em governance_meetings com company_id, created_by, status='scheduled'
  - Campos: title, meeting_type, scheduled_date, scheduled_time, duration_minutes, location, notes
  - Se houver agenda_items no data, cria itens de pauta em governance_agenda_items

update_meeting:
  - Busca por meeting_id ou meeting_title (ilike + company_id)
  - Atualiza campos fornecidos (title, scheduled_date, scheduled_time, status, notes, etc.)

delete_meeting:
  - Cascata: apaga governance_agenda_items e governance_atas vinculados, depois a reuniao

create_agenda_item:
  - Resolve meeting_id por ID direto ou meeting_title (ilike)
  - Insere em governance_agenda_items com order_index auto-calculado

update_golden_circle:
  - Upsert em golden_circle (company_id como chave)
  - Campos: why_question, how_question, what_question

update_swot:
  - Upsert em swot_analysis (company_id como chave)
  - Campos: strengths, weaknesses, opportunities, threats

update_vision_alignment:
  - Upsert em vision_alignment (company_id como chave)
  - Campos: shared_objectives, shared_commitments, shared_resources, shared_risks
```

A permissao continua sendo a mesma (`strategic-planning` manager/admin), pois todas essas ferramentas estao dentro do Strategy HUB.

**Arquivo 2: `supabase/functions/ai-chat/index.ts`**

Adicionar acoes 18-24 na documentacao do system prompt:

```text
18. create_meeting — Cria reuniao de governanca RMRE
    - Campos: title (obrigatorio), meeting_type (RM/RE/Extraordinaria, obrigatorio), scheduled_date (YYYY-MM-DD, obrigatorio), scheduled_time (HH:MM), duration_minutes, location, notes
    - Pode incluir agenda_items: array de {title, description}

19. update_meeting — Atualiza reuniao existente
    - Campos: meeting_id ou meeting_title, title, scheduled_date, scheduled_time, status, notes, location, duration_minutes

20. delete_meeting — Remove reuniao e dados vinculados
    - Campos: meeting_id ou meeting_title

21. create_agenda_item — Cria item de pauta em reuniao existente
    - Campos: meeting_id ou meeting_title (obrigatorio), title (obrigatorio), description

22. update_golden_circle — Atualiza o Golden Circle da empresa
    - Campos: why_question, how_question, what_question

23. update_swot — Atualiza a Analise SWOT da empresa
    - Campos: strengths, weaknesses, opportunities, threats

24. update_vision_alignment — Atualiza o Alinhamento de Visao
    - Campos: shared_objectives, shared_commitments, shared_resources, shared_risks
```

Tambem atualizar a descricao do menu de Ferramentas no PLATFORM_KNOWLEDGE para incluir Governanca RMRE.

**Deploy**: Redeployar `ai-agent-execute` e `ai-chat`.

### Sequencia de Implementacao

1. Adicionar os 7 novos handlers no `ai-agent-execute`
2. Documentar as novas acoes no system prompt do `ai-chat`
3. Deploy de ambas as edge functions
4. Testar pedindo ao Atlas para marcar uma reuniao
