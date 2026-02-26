

## Plano: Auto-Routing Inteligente de Modelo (Flash vs Pro)

### Problema
Usuários esquecem de ativar o modo "Plan" e enviam mensagens complexas (criar objetivos, KRs, análises) usando o Gemini Flash, resultando em respostas ruins ou erros. O toggle manual é uma fonte de fricção.

### Solução
Implementar um **classificador de intenção leve** na Edge Function `ai-chat` que, quando `plan_mode` está desativado, analisa a mensagem do usuário e decide automaticamente se deve usar o modelo Pro (complexo) ou manter o Flash (simples).

### Arquitetura

```text
Usuário envia mensagem (plan_mode = false)
        │
        ▼
  ┌─────────────────────┐
  │ Classificador local  │  (regex/heurística no backend)
  │ needsProModel()      │
  └──────┬──────────────┘
         │
    ┌────┴────┐
    │ simples │ → Gemini Flash (comportamento atual)
    │complexo │ → Gemini Pro + max_tokens 16000
    │         │   + prefixo [MODO PLAN ATIVO] na mensagem
    └─────────┘
```

### Implementação

#### 1. Edge Function `ai-chat/index.ts` — Adicionar função `needsProModel()`

Uma função heurística que detecta intenções complexas via padrões na mensagem:

- **Criação/modificação estratégica**: criar, adicionar, cadastrar, implementar, montar, estruturar + (objetivo, KR, pilar, iniciativa, projeto, SWOT, golden circle, FCA, reunião, task)
- **Análise profunda**: analisar, diagnosticar, avaliar, comparar, detalhar + contexto estratégico
- **Planejamento**: plano estratégico, BSC, balanced scorecard, planejamento, importar, bulk
- **Operações destrutivas**: deletar, remover, excluir + entidades estratégicas
- **Atualização de estrutura**: atualizar, editar, modificar + entidades estratégicas (mas NOT check-in simples)

Mensagens que **ficam no Flash**:
- Cumprimentos, navegação, perguntas simples
- Check-ins de KR (atualizar valor)
- Perguntas sobre o que está salvo
- Resumos rápidos

#### 2. Lógica de seleção de modelo (linhas 416-422)

Mudar de:
```
const model = plan_mode ? 'google/gemini-2.5-pro' : flash
```

Para:
```
const autoDetectedPlan = !plan_mode && needsProModel(message);
const effectivePlanMode = plan_mode || autoDetectedPlan;
const model = effectivePlanMode ? 'google/gemini-2.5-pro' : flash;
const maxTokens = effectivePlanMode ? 16000 : (settings || 2000);
```

#### 3. Prefixo automático na mensagem

Quando `autoDetectedPlan` é true, adicionar o mesmo prefixo `[MODO PLAN ATIVO]` que o frontend usa, para que o modelo saiba que deve gerar blocos `[ATLAS_PLAN]`.

#### 4. Resposta inclui flag `auto_plan`

Retornar no response (tanto streaming quanto não-streaming) um indicador `auto_plan: true` para que o frontend possa, opcionalmente, mostrar um badge "Atlas usou Plan automaticamente" na mensagem.

#### 5. Frontend `FloatingAIChat.tsx` — Exibir indicador visual (opcional)

Quando a resposta contém `auto_plan: true`, mostrar um pequeno badge na mensagem do assistente indicando que o modelo Pro foi usado automaticamente.

### Arquivos a editar

1. **`supabase/functions/ai-chat/index.ts`** — Adicionar `needsProModel()`, ajustar lógica de seleção de modelo e prefixo
2. **`src/components/ai/FloatingAIChat.tsx`** — (Opcional) Badge visual de auto-routing

### Vantagens
- Zero mudança na UX — o toggle Plan continua existindo para forçar manualmente
- Sem chamada extra de API — classificação por regex/heurística, custo zero
- Retrocompatível — se `plan_mode = true`, comportamento idêntico ao atual

