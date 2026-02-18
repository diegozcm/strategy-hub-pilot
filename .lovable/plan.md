

# Plano: Governanca RMRE - Regras, Pautas, ATAs e Agenda

## Visao geral

Transformar a aba "Governanca RMRE" em um modulo completo com 4 sub-abas internas: **Regras**, **Pautas**, **ATAs** e **Agenda**. Sem integracao com Google Calendar por enquanto - agenda interna no Strategy.

## Estrutura visual

```text
Ferramentas
[Golden Circle] [SWOT] [Alinhamento de Visao] [Governanca RMRE]

Governanca RMRE
Calendario de governanca para reunioes de monitoramento, revisao e execucao

  [Regras] [Pautas] [ATAs] [Agenda]
  +-----------------------------------------+
  | (conteudo da sub-aba selecionada)       |
  +-----------------------------------------+
```

---

## 1. Banco de dados - 4 novas tabelas

### `governance_rules` (Regras da governanca)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK companies | |
| description | text | Texto descritivo geral das regras |
| created_by | uuid | Quem criou |
| updated_by | uuid | Quem atualizou por ultimo |
| created_at / updated_at | timestamptz | |

### `governance_rule_items` (Itens individuais de regras)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| governance_rule_id | uuid FK governance_rules | |
| title | text | Titulo da regra especifica |
| description | text | Detalhamento (opcional) |
| order_index | integer | Ordem de exibicao |
| created_by | uuid | |
| created_at / updated_at | timestamptz | |

### `governance_meetings` (Reunioes agendadas)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| company_id | uuid FK companies | |
| title | text | Ex: "RM Semanal", "RE Mensal" |
| meeting_type | text | "RM", "RE", "Extraordinaria" |
| scheduled_date | date | Data da reuniao |
| scheduled_time | time | Horario |
| duration_minutes | integer | Duracao estimada |
| location | text | Local ou link da reuniao |
| status | text | "scheduled", "completed", "cancelled" |
| notes | text | Observacoes |
| created_by | uuid | |
| created_at / updated_at | timestamptz | |

### `governance_agenda_items` (Pautas - itens da reuniao)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| meeting_id | uuid FK governance_meetings | |
| title | text | Assunto da pauta |
| description | text | Detalhamento |
| responsible_user_id | uuid | Responsavel pelo item |
| order_index | integer | Ordem |
| status | text | "pending", "discussed", "deferred" |
| created_by | uuid | |
| created_at / updated_at | timestamptz | |

### `governance_atas` (Atas de reuniao)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| meeting_id | uuid FK governance_meetings | |
| content | text | Conteudo da ata (texto rico) |
| decisions | text | Decisoes tomadas |
| participants | text[] | Lista de participantes |
| approved | boolean | Se a ata foi aprovada |
| approved_by | uuid | |
| approved_at | timestamptz | |
| created_by | uuid | |
| created_at / updated_at | timestamptz | |

RLS: Todas as tabelas terao RLS habilitado, com politicas que permitem acesso apenas a usuarios que pertencem a empresa (usando `user_belongs_to_company` ou `is_system_admin`).

---

## 2. Frontend - Componentes

### Estrutura de arquivos novos

```text
src/components/tools/governance/
  GovernancaSubTabs.tsx        -- Sub-abas internas (Regras|Pautas|ATAs|Agenda)
  GovernanceRulesSection.tsx   -- Texto geral + lista de regras
  GovernanceRuleItemForm.tsx   -- Modal/form para adicionar/editar regra
  GovernanceMeetingsSection.tsx -- Agenda/calendario de reunioes
  GovernanceMeetingForm.tsx    -- Form para criar/editar reuniao
  GovernanceAgendaSection.tsx  -- Pautas de uma reuniao
  GovernanceAgendaItemForm.tsx -- Form para item de pauta
  GovernanceAtasSection.tsx    -- Lista e visualizacao de ATAs
  GovernanceAtaForm.tsx        -- Form para criar/editar ATA

src/hooks/
  useGovernanceRules.tsx       -- CRUD regras
  useGovernanceMeetings.tsx    -- CRUD reunioes
  useGovernanceAgendaItems.tsx -- CRUD pautas
  useGovernanceAtas.tsx        -- CRUD atas
```

### GovernancaRMRETab.tsx (atualizado)

Deixa de ser placeholder e passa a renderizar o componente `GovernancaSubTabs` com as 4 sub-abas.

### Sub-aba "Regras"
- Card com textarea para o texto descritivo geral (editavel inline)
- Abaixo, lista de regras especificas com titulo + descricao
- Botoes: Adicionar regra, Editar, Excluir, Reordenar (drag-and-drop opcional)
- Botao Salvar para o texto descritivo

### Sub-aba "Pautas"
- Lista de reunioes com suas pautas
- Ao clicar em uma reuniao, mostra os itens da pauta
- Cada item: titulo, descricao, responsavel (select com useCompanyUsers), status
- Botao para adicionar item de pauta

### Sub-aba "ATAs"
- Lista de ATAs vinculadas a reunioes
- Cada ATA: conteudo em texto, decisoes, participantes
- Status de aprovacao
- Botao para criar nova ATA (vinculada a uma reuniao)

### Sub-aba "Agenda"
- Calendario mensal mostrando reunioes agendadas
- Usar o componente Calendar do shadcn como base visual
- Lista de reunioes do mes selecionado abaixo do calendario
- Botao para agendar nova reuniao (modal com form: titulo, tipo, data, horario, duracao, local)
- Indicadores visuais no calendario para dias com reunioes

---

## 3. Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | Criar 5 tabelas + RLS policies |
| `src/components/tools/GovernancaRMRETab.tsx` | Atualizar - renderizar sub-abas |
| `src/components/tools/governance/*.tsx` (8 arquivos) | Criar - componentes das sub-abas |
| `src/hooks/useGovernance*.tsx` (4 arquivos) | Criar - hooks de CRUD |
| `src/components/tools/index.ts` | Atualizar exports |

## Ordem de implementacao sugerida

1. Migracao do banco (tabelas + RLS)
2. Hooks de dados (useGovernance*)
3. Sub-aba Regras (mais simples, bom ponto de partida)
4. Sub-aba Agenda (calendario + form de reuniao)
5. Sub-aba Pautas (depende de reunioes existirem)
6. Sub-aba ATAs (depende de reunioes existirem)

