

# Fix: 3 Problemas do Atlas Chat

## Problema 1: KRs falham com "Objetivo de referencia nao encontrado"

O LLM gera KRs com `objective_title` como referencia ao objetivo, mas o backend (`normalizeKRData`) so reconhece `parent_objective` e `parent_objective_title`. O campo `objective_title` e ignorado.

Alem disso, o LLM nao inclui `objective_ref: 0` nos KRs, que seria a forma mais confiavel de vincular ao objetivo criado na mesma batch.

### Correcoes:

**Backend (`supabase/functions/ai-agent-execute/index.ts`):**
- Adicionar `objective_title` como alias em `normalizeKRData`:
  ```
  parent_objective: data.parent_objective || data.parent_objective_title || data.objective_title || null
  ```

**Frontend (`FloatingAIChat.tsx` - funcao `extractPlan`):**
- Apos normalizar os action types, adicionar logica para injetar `objective_ref: 0` em KRs que nao tenham `objective_ref`, `objective_id` nem `parent_objective` - quando existir um `create_objective` antes no array.
- Mesma logica para iniciativas: injetar `key_result_ref` apontando para o primeiro KR criado.

---

## Problema 2: Botoes de feedback ausentes em mensagens com plano

Linha 750 tem a condicao `!msg.plan` que exclui mensagens com plano dos botoes de Reiniciar/ThumbsUp/ThumbsDown.

### Correcao:

- Remover `!msg.plan` da condicao. Mostrar botoes de feedback em TODAS as mensagens do assistente.
- Ajustar para nao mostrar apenas durante status `executing`.

---

## Problema 3: Botao Reiniciar envia mensagem duplicada

O botao Reiniciar chama `handleSendMessage(prevUserMsg.content)` que cria uma NOVA mensagem do usuario na conversa. O comportamento correto e:
1. Remover a resposta atual do assistente
2. Regenerar a resposta sem adicionar nova mensagem do usuario

### Correcao:

- Criar uma funcao `handleRegenerate(msgIndex)` que:
  1. Encontra a mensagem do usuario anterior
  2. Remove a resposta do assistente atual
  3. Chama a API diretamente (sem adicionar nova user message) passando o conteudo da mensagem anterior

---

## Arquivos alterados

1. `supabase/functions/ai-agent-execute/index.ts` - adicionar alias `objective_title`
2. `src/components/ai/FloatingAIChat.tsx` - corrigir feedback buttons, restart, e auto-inject objective_ref

