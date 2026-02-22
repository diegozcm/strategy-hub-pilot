

## Correcao: Atlas nao busca dados de SWOT/Golden Circle e mistura respostas

### Problema
Quando o usuario pergunta "o que tem salvo no SWOT e Golden Circle?", o Atlas:
1. Inventa os dados porque nao tem acesso real a essas tabelas no contexto
2. Mistura a resposta com planos de FCA que ninguem pediu

### Causa raiz

**1. Dados ausentes no contexto**: O bloco de fetch de contexto (linhas 422-508 do `ai-chat/index.ts`) busca `strategic_objectives`, `key_results`, `governance_meetings`, etc., mas NUNCA consulta as tabelas `golden_circle`, `swot_analysis` ou `vision_alignment`. O Atlas responde "de memoria" (alucinacao).

**2. Prompt excessivamente agressivo para acoes**: O sistema nao instrui o Atlas a diferenciar perguntas de consulta ("o que tem salvo?") de pedidos de execucao ("crie uma FCA"). Resultado: o Atlas gera `[ATLAS_PLAN]` mesmo quando so precisa ler e exibir dados.

### Correcoes

**Arquivo: `supabase/functions/ai-chat/index.ts`**

**Correcao 1 — Buscar dados das ferramentas estrategicas**

No bloco de `Promise.all` (linha 426), adicionar 3 novas queries:

```
goldenCircleResult:
  supabase.from('golden_circle')
    .select('why_question, how_question, what_question, updated_at')
    .eq('company_id', company_id)
    .maybeSingle()

swotResult:
  supabase.from('swot_analysis')
    .select('strengths, weaknesses, opportunities, threats, updated_at')
    .eq('company_id', company_id)
    .maybeSingle()

visionResult:
  supabase.from('vision_alignment')
    .select('shared_objectives, shared_commitments, shared_resources, shared_risks, updated_at')
    .eq('company_id', company_id)
    .maybeSingle()
```

**Correcao 2 — Incluir dados no contexto enviado ao Atlas**

Apos o bloco de governanca (linha 504), adicionar secoes para cada ferramenta:

```
Se golden_circle existir:
  "Ferramentas Estrategicas - Golden Circle:
   Why: [why_question]
   How: [how_question]
   What: [what_question]
   Atualizado em: [updated_at]"

Se swot_analysis existir:
  "Analise SWOT:
   Forcas: [strengths]
   Fraquezas: [weaknesses]
   Oportunidades: [opportunities]
   Ameacas: [threats]
   Atualizado em: [updated_at]"

Se vision_alignment existir:
  "Alinhamento de Visao:
   Objetivos: [shared_objectives]
   Compromissos: [shared_commitments]
   Recursos: [shared_resources]
   Riscos: [shared_risks]
   Atualizado em: [updated_at]"
```

**Correcao 3 — Instrucao para diferenciar leitura vs execucao**

Adicionar regra no system prompt (apos a secao "Analises de dados e metricas", linha 268):

```
### Consultas sobre dados salvos (SWOT, Golden Circle, Visao, etc.)
-> Quando o usuario perguntar "o que tem salvo?", "me mostra o SWOT", "qual o Golden Circle?",
   responda SOMENTE com os dados do contexto. NAO gere [ATLAS_PLAN].
   NAO misture com acoes de FCA ou outros planos nao solicitados.
   Responda APENAS o que foi perguntado.
```

**Deploy**: Redeployar `ai-chat`.

### Resultado Esperado

Quando o usuario perguntar "o que tem salvo no SWOT e Golden Circle?", o Atlas respondera APENAS com os dados reais do banco, sem inventar valores e sem propor planos de execucao nao solicitados.
