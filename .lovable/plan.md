

# Remover Limites de Texto do Atlas

## Problema

A IA esta sendo cortada por **dois limitadores**:

1. **`max_tokens` no backend**: Em modo Plan = 4000 tokens, modo normal = valor do banco (default 2000). Para planejamentos complexos com JSON, 4000 tokens nao e suficiente.
2. **Regra de brevidade no system prompt**: O prompt tem "REGRA #2: BREVIDADE" que instrui a IA a ser curta, mas isso conflita com planejamentos que precisam ser detalhados.

## Correcoes

### 1. Backend: Remover limite de tokens no modo Plan

**Arquivo: `supabase/functions/ai-chat/index.ts`** (linha 329)

Mudar de:
```
const maxTokens = plan_mode ? 4000 : (aiSettings?.max_tokens || 2000);
```
Para:
```
const maxTokens = plan_mode ? 16000 : (aiSettings?.max_tokens || 2000);
```

16000 tokens e suficiente para qualquer planejamento estrategico completo com JSON. O Gemini 2.5 Pro suporta ate 65k tokens de saida.

### 2. Backend: Remover limite no campo do settings (UI)

**Arquivo: `src/components/ai/AISettingsModal.tsx`** (linha 166)

Mudar o `max` do input de 4000 para 16000, para que o admin possa configurar valores maiores se necessario.

### 3. System Prompt: Diferenciar brevidade de planejamento

**Arquivo: `supabase/functions/ai-chat/index.ts`** (linha 162-163)

Alterar a regra de brevidade para:
```
## REGRA #2: BREVIDADE (apenas para conversas casuais)
Para cumprimentos e perguntas simples, seja breve.
Para PLANEJAMENTOS e [ATLAS_PLAN], escreva com o maximo de detalhe necessario.
Nunca corte ou resuma um plano estrategico. Inclua TODOS os objetivos, KRs, 
iniciativas, metas e datas sem omitir nada.
```

### Resumo das mudancas

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/ai-chat/index.ts` | max_tokens Plan: 4000 -> 16000 |
| `supabase/functions/ai-chat/index.ts` | Regra brevidade: excetuar planejamentos |
| `src/components/ai/AISettingsModal.tsx` | Input max: 4000 -> 16000 |

