
# Corrigir Atlas: Plano Detectado mas Nao Funcional

## Diagnostico Real

Analisei a conversa do Bernardo com o Atlas e identifiquei **3 problemas criticos**:

### Problema 1: O modelo HALLUCINA a execucao
O Atlas gera o bloco `[ATLAS_PLAN]` mas depois diz **"Acoes concluidas com sucesso!"** como se tivesse executado. Ele nao espera o usuario aprovar. O prompt diz "Termine com: Deseja que eu prossiga?" mas o modelo ignora e finge que ja fez tudo.

### Problema 2: O regex `extractPlan` pode nao capturar o bloco
Se o modelo nao fechar corretamente com `[/ATLAS_PLAN]`, o regex falha e os botoes Aprovar/Reprovar nunca aparecem. O modelo coloca texto DEPOIS do bloco que pode interferir.

### Problema 3: Tipos de acao em formato diferente
O modelo gera `"type": "CREATE_OBJECTIVE"` (maiusculo), mas `ai-agent-execute` espera `"create_objective"` (minusculo). Mesmo que o plano seja detectado e aprovado, a execucao falharia.

---

## Plano de Correcao

### Etapa 1: Corrigir o system prompt — proibir hallucinacao de execucao

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Adicionar ao prompt:

```
NUNCA diga que as acoes foram "concluidas", "executadas" ou "aplicadas". 
Voce NAO executa diretamente. O sistema mostrara botoes "Aprovar" e "Reprovar" para o usuario.
Apos o bloco [ATLAS_PLAN], diga APENAS algo como: "Preparei o plano acima. Clique em Aprovar para que eu execute."
NUNCA escreva texto apos [/ATLAS_PLAN] que sugira que a execucao ja aconteceu.
```

Tambem reforcar que o bloco DEVE ter a tag de fechamento `[/ATLAS_PLAN]`.

### Etapa 2: Tornar `extractPlan` mais robusto

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

O regex atual: `/\[ATLAS_PLAN\]\s*([\s\S]*?)\s*\[\/ATLAS_PLAN\]/`

Melhorar para:
- Aceitar variantes (com ou sem barra de fechamento)
- Se nao encontrar `[/ATLAS_PLAN]`, tentar extrair o JSON ate o fim da mensagem
- Tratar JSON com formatacao markdown (dentro de blocos de codigo)

### Etapa 3: Normalizar tipos de acao em `ai-agent-execute`

**Arquivo**: `supabase/functions/ai-agent-execute/index.ts`

No loop de acoes, converter `action.type` para minusculo antes de comparar:
```
const actionType = action.type.toLowerCase();
if (actionType === 'create_objective') { ... }
```

Tambem aceitar variantes como `create_kr` (alem de `create_key_result`).

### Etapa 4: Corrigir auto-scroll

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

O `querySelector('[data-radix-scroll-area-viewport]')` pode retornar o viewport errado (ha multiplos ScrollAreas: historico e chat). Mudar para usar um container ref especifico no ScrollArea do chat e buscar o viewport DENTRO dele.

---

## Secao Tecnica

### Prompt reforco anti-hallucinacao (Etapa 1)

Na secao "REGRAS DO PLANO" do `buildSystemPrompt`, adicionar ANTES do item "Termine com":

```
- IMPORTANTISSIMO: Voce NAO executa o plano. O frontend exibira botoes "Aprovar" e "Reprovar".
- NUNCA diga "Acoes concluidas", "Executado com sucesso", "Ja criei", "Pronto, foi cadastrado" ou variantes.
- Apos o bloco [/ATLAS_PLAN], escreva SOMENTE: "Preparei o plano acima. Clique em **Aprovar** para que eu execute, ou **Reprovar** para ajustar."
- O bloco [ATLAS_PLAN] DEVE terminar com [/ATLAS_PLAN] (tag de fechamento obrigatoria).
```

### extractPlan robusto (Etapa 2)

```typescript
function extractPlan(content: string): { cleanContent: string; plan: any | null } {
  // Tentar regex com fechamento
  let match = content.match(/\[ATLAS_PLAN\]\s*([\s\S]*?)\s*\[\/ATLAS_PLAN\]/);
  
  // Fallback: sem tag de fechamento (pegar ate o fim)
  if (!match) {
    match = content.match(/\[ATLAS_PLAN\]\s*([\s\S]*)/);
  }
  
  if (!match) return { cleanContent: content, plan: null };
  
  try {
    // Limpar: remover markdown code fences se existirem
    let jsonStr = match[1].trim();
    jsonStr = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');
    
    const plan = JSON.parse(jsonStr);
    
    // Normalizar action types para minusculo
    if (plan.actions) {
      plan.actions = plan.actions.map((a: any) => ({
        ...a,
        type: a.type.toLowerCase()
          .replace('create_kr', 'create_key_result')
      }));
    }
    
    const cleanContent = content
      .replace(/\[ATLAS_PLAN\][\s\S]*?(\[\/ATLAS_PLAN\]|$)/, '')
      .trim();
    return { cleanContent, plan };
  } catch {
    return { cleanContent: content, plan: null };
  }
}
```

### Normalizacao em ai-agent-execute (Etapa 3)

No loop principal, trocar comparacoes diretas por normalizacao:

```typescript
const actionType = action.type.toLowerCase().replace('create_kr', 'create_key_result');

if (actionType === 'create_objective') { ... }
else if (actionType === 'create_key_result') { ... }
else if (actionType === 'create_initiative') { ... }
```

### Auto-scroll com ref especifico (Etapa 4)

Adicionar um `ref` ao container do ScrollArea do chat e buscar o viewport dentro dele:

```typescript
const chatScrollRef = useRef<HTMLDivElement>(null);

const scrollToBottom = useCallback(() => {
  setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Fallback: viewport DENTRO do ScrollArea do chat
    const viewport = chatScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, 150);
}, []);

// No JSX: envolver o ScrollArea do chat com um div ref
<div ref={chatScrollRef}>
  <ScrollArea className="flex-1 pr-4">
    ...
  </ScrollArea>
</div>
```

---

## Arquivos a editar

1. **`supabase/functions/ai-chat/index.ts`** — Reforcar prompt para proibir hallucinacao de execucao e exigir tag de fechamento
2. **`src/components/ai/FloatingAIChat.tsx`** — extractPlan robusto + normalizacao de tipos + auto-scroll com ref especifico
3. **`supabase/functions/ai-agent-execute/index.ts`** — Normalizar action types (minusculo + alias create_kr)

## Resultado Esperado

- Atlas gera `[ATLAS_PLAN]...[/ATLAS_PLAN]` e diz "Clique em Aprovar para que eu execute"
- Frontend detecta o bloco, mostra botoes Aprovar/Reprovar
- Usuario clica Aprovar, `ai-agent-execute` recebe o plano com tipos normalizados
- Dados sao inseridos no banco, mensagem de confirmacao aparece
- Chat rola automaticamente para a ultima mensagem
