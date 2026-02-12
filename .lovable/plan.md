
# Atlas Hub - Redesign Completo do Copilot Hub

## Resumo

Renomear "Copilot Hub" para "Atlas Hub" e transformar a pagina de insights em um diagnostico completo e profissional da empresa, com o Atlas como narrador dos insights, dados abrangentes de TODAS as tabelas do Strategy Hub, design moderno com botoes de navegacao direta, e reposicionamento do botao no header.

## 1. Renomear Copilot para Atlas Hub

Todos os textos e referencias serao atualizados:
- "Copilot HUB" -> "Atlas Hub" (header, sidebar admin, modulos)
- "Copiloto de IA" -> "Atlas Hub" (titulo da pagina)
- "IA Copilot" -> "Atlas Hub" (admin pages, modulos)
- Icone Brain -> icone do Atlas (ou manter Brain com estilo atlas)
- Rota `/app/ai-copilot` permanece a mesma para nao quebrar links

### Arquivos afetados:
- `src/components/layout/DashboardHeader.tsx` (texto do botao)
- `src/components/ai/AICopilotPage.tsx` (titulo, descricao)
- `src/components/admin-v2/config/sidebarContent.ts` (label)
- `src/components/admin-v2/pages/modules/ModulesByCompanyPage.tsx` (labels)
- `src/components/admin-v2/pages/dashboard/RegisteredCompaniesPage.tsx` (label)
- `src/components/admin-v2/pages/dashboard/DashboardOverviewPage.tsx` (description)

## 2. Botao Atlas Hub no Header - Mover para Esquerda da Empresa

Atualmente a ordem e: `[CompanyDisplay] [Copilot HUB] [Avatar/Nome]`

Nova ordem: `[Atlas Hub] [CompanyDisplay] [Avatar/Nome]`

### Arquivo: `src/components/layout/DashboardHeader.tsx`
- Mover o bloco NavLink do Atlas Hub para ANTES do CompanyDisplay
- Trocar texto para "Atlas Hub"

## 3. Dados Faltantes no Edge Function `generate-insights`

A edge function atualmente busca APENAS:
- `strategic_plans` (ids)
- `strategic_objectives` (titulo, progresso, status)
- `key_results` (titulo, valor atual/meta, unidade)
- `strategic_projects` (nome, progresso, status, datas, budget)
- `startup_hub_profiles`
- `mentoring_sessions`

**Tabelas que NAO sao analisadas (e deveriam ser):**

| Tabela | O que contem |
|--------|-------------|
| `strategic_pillars` | Pilares estrategicos da empresa |
| `kr_initiatives` | Iniciativas vinculadas a KRs (status, progresso, budget, responsavel) |
| `kr_monthly_actions` | Acoes mensais dos KRs (status, % conclusao, planejado vs real) |
| `kr_fca` | Analises FCA (Fato-Causa-Acao) dos KRs |
| `project_tasks` | Tarefas dos projetos (status, horas estimadas vs reais, prioridade) |
| `golden_circle` | Golden Circle (Why/How/What) |
| `swot_analysis` | Analise SWOT (forcas, fraquezas, oportunidades, ameacas) |
| `vision_alignment` | Alinhamento de Visao |
| `beep_assessments` | Avaliacoes BEEP de maturidade |
| `companies` | Missao, Visao e Valores da empresa |
| `key_results` campos extras | `monthly_targets`, `monthly_actual`, `yearly_target`, `yearly_actual`, `frequency`, `start_month`, `end_month`, `weight` |

### Arquivo: `supabase/functions/generate-insights/index.ts`
- Adicionar queries para TODAS as tabelas listadas acima
- Incluir todos esses dados no `contextData` enviado para a IA
- Enriquecer o prompt do AI para analisar cada modulo separadamente
- Buscar KRs com campos completos (monthly_targets, monthly_actual, yearly_target, etc)

## 4. Redesign da Pagina AICopilotPage - Formato Conversacional

A pagina atual mostra cards genericos com badges. O novo design sera mais profissional e conversacional, onde o Atlas "narra" os insights.

### Nova Estrutura da Pagina:

```text
+-------------------------------------------------------+
| [Atlas Icon] Atlas Hub                    [Limpar] [Analisar] |
| Diagnostico estrategico completo                       |
+-------------------------------------------------------+
| KPI Cards (3): Insights | Alertas Criticos | Score Geral |
+-------------------------------------------------------+
| [Insights Ativos] [Historico]                          |
+-------------------------------------------------------+
| Insight Card (novo design):                            |
| +---------------------------------------------------+ |
| | [Atlas avatar] Atlas - risk - critical              | |
| |                                                     | |
| | "O KR 'Realizar UMA VENDA' esta com 0% de          | |
| | atingimento. Valor atual: 0 / Meta: 1.             | |
| | Recomendo revisar o plano de acao..."               | |
| |                                                     | |
| | [Ver KR ->] [Ver Objetivo ->] [Ver Projeto ->]      | |
| |                                                     | |
| | Confianca: 95%   Categoria: indicators              | |
| | [Confirmar] [Descartar]                             | |
| +---------------------------------------------------+ |
```

### Mudancas no design dos cards de insight:
1. **Avatar do Atlas** no topo de cada insight (mini ColorOrb ou icone)
2. **Texto narrativo** em vez de descricao tecnica seca - o Atlas "fala" como um consultor
3. **Botoes de navegacao direta**: Se o insight cita um KR, mostrar botao "Ver KR" que navega para `/app/indicators` (ou abre modal). Se cita objetivo, "Ver Objetivo" navega para `/app/objectives`. Se cita projeto, "Ver Projeto" navega para `/app/projects`
4. **Recomendacoes inline**: Em vez de mostrar metadata como JSON, listar recomendacoes como bullets claros
5. **Melhor hierarquia visual**: Severity com cores mais claras, confianca com barra visual elegante
6. **Cards com hover sutil** e bordas mais refinadas

### Botoes de Navegacao por Entidade:
- `related_entity_type === 'key_result'` + `related_entity_id` -> Link para `/app/indicators` com scroll/highlight do KR
- `related_entity_type === 'objective'` + `related_entity_id` -> Link para `/app/objectives`
- `related_entity_type === 'project'` + `related_entity_id` -> Link para `/app/projects`
- `related_entity_type === 'startup'` -> Link para `/app/startups`

### Modal de detalhes melhorado:
- Mostrar metadata formatado (nao JSON raw)
- Listar recomendacoes como checklist
- Mostrar dados contextuais do insight (valores, metas, datas)
- Botoes de acao mais claros

## 5. Melhorar Prompt da IA

O prompt atual pede formato generico. O novo prompt devera:
- Pedir que o Atlas escreva em tom conversacional e consultivo ("Identifiquei que...", "Recomendo que...")
- Incluir contexto do Golden Circle, SWOT e Alinhamento de Visao na analise
- Pedir analise cruzada entre ferramentas (ex: SWOT x performance dos KRs)
- Pedir que relacione insights com entidades especificas (`related_entity_id`)
- Aumentar `max_tokens` para 4000 para cobrir todos os modulos

## Sequencia de Implementacao

1. **Header**: Mover botao para esquerda e renomear para "Atlas Hub"
2. **Renomear textos**: Atualizar todos os labels de "Copilot" para "Atlas"
3. **Edge function**: Adicionar todas as queries faltantes e enriquecer o prompt
4. **Frontend**: Redesenhar cards de insight com estilo conversacional e botoes de navegacao
5. **Deploy**: Fazer deploy da edge function atualizada

## Secao Tecnica - Arquivos

| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `src/components/layout/DashboardHeader.tsx` | Reordenar botao + renomear |
| `src/components/ai/AICopilotPage.tsx` | Redesign completo dos cards, titulo, navegacao |
| `supabase/functions/generate-insights/index.ts` | Adicionar 10+ queries, enriquecer prompt |
| `src/components/admin-v2/config/sidebarContent.ts` | Renomear label |
| `src/components/admin-v2/pages/modules/ModulesByCompanyPage.tsx` | Renomear labels |
| `src/components/admin-v2/pages/dashboard/RegisteredCompaniesPage.tsx` | Renomear label |
| `src/components/admin-v2/pages/dashboard/DashboardOverviewPage.tsx` | Renomear description |
