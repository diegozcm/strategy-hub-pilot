

## Diagnóstico do Problema

O erro ocorre quando o Atlas gera um plano muito grande (muitos objetivos + KRs) que excede o limite de tokens de saída do modelo (16.000 tokens no modo Plan). O JSON do `[ATLAS_PLAN]` é cortado no meio, resultando em JSON inválido.

Quando o `JSON.parse` falha no frontend, o catch block em `extractPlan()` retorna o conteúdo bruto completo, incluindo o `[ATLAS_PLAN]` truncado visível para o usuário. Ou seja, o usuário vê o JSON técnico que deveria ser invisível.

Dois problemas distintos precisam ser corrigidos:

### Correção 1: Frontend — `extractPlan()` deve limpar o bloco mesmo quando o JSON falha

Arquivo: `src/hooks/useAtlasChat.ts` (e duplicado em `src/components/ai/FloatingAIChat.tsx`)

No catch block (linha 129), ao invés de retornar `content` bruto, remover o bloco `[ATLAS_PLAN]` do texto antes de retornar, e adicionar uma mensagem amigável informando que o plano foi muito grande.

```
catch {
  // Remove the raw [ATLAS_PLAN] block even on parse failure
  const cleanContent = content
    .replace(/\[ATLAS_PLAN\][\s\S]*?(\[\/ATLAS_PLAN\]|$)/, '')
    .trim()
    + '\n\n⚠️ O plano gerado foi muito extenso e não pôde ser processado. Tente dividir em partes menores (ex: "Crie OKRs apenas para o pilar Pessoas & Cultura").';
  return { cleanContent, plan: null };
}
```

### Correção 2: Backend — Aumentar max_tokens para planos complexos e adicionar instrução de divisão

Arquivo: `supabase/functions/ai-chat/index.ts`

- Aumentar `maxTokens` de 16000 para 32000 no modo Plan para acomodar planos grandes.
- Adicionar instrução no system prompt orientando o modelo a dividir planos muito extensos em múltiplas mensagens (ex: 1 pilar por vez) caso perceba que o plano terá muitas ações.

### Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| `src/hooks/useAtlasChat.ts` | Catch block limpa `[ATLAS_PLAN]` e mostra aviso amigável |
| `src/components/ai/FloatingAIChat.tsx` | Mesma correção (código duplicado) |
| `supabase/functions/ai-chat/index.ts` | Aumentar max_tokens para 32000 no plan mode + instrução de divisão |

