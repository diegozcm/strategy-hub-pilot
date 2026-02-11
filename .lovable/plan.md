
# Corrigir Indicador de Digitacao e Respostas Longas Desnecessarias

## Problemas

### 1. Indicador "digitando" desaparece antes do streaming
Na linha 232, `isLoading` e definido como `false` antes do streaming comecar. Na linha 476, o `TypingIndicator` so aparece quando `isLoading === true`. Resultado: durante o tempo entre o fim do loading e a chegada do primeiro token, o usuario ve uma bolha de mensagem vazia -- a experiencia de "tela branca" relatada.

### 2. IA ainda despeja dados em respostas simples
Mesmo com o prompt dizendo "use somente quando solicitado", os dados contextuais da empresa sao enviados como mensagem de sistema em TODA requisicao (linha 235). A IA ve os dados e sente necessidade de menciona-los. O prompt precisa ser mais enfatico e a estrutura de mensagens precisa reforcar isso.

---

## Plano de Acao

### Etapa 1: Mostrar "digitando..." durante streaming ate o primeiro token chegar

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

- Na linha 476, mudar a condicao de `{isLoading && <TypingIndicator />}` para `{(isLoading || (isStreaming && messages[messages.length - 1]?.content === '')) && <TypingIndicator />}`
- Isso faz o indicador "digitando..." aparecer tanto durante o loading quanto enquanto o streaming nao produziu conteudo ainda
- Quando o primeiro token chegar e o content deixar de ser vazio, o indicador desaparece e a mensagem real aparece

### Etapa 2: Nao adicionar bolha vazia no inicio do streaming

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

- Na linha 274, o codigo cria uma mensagem vazia (`content: ''`) e adiciona ao chat antes de qualquer token chegar. Isso gera a bolha vazia visivel.
- Mudar para so adicionar a mensagem do assistente quando o primeiro token chegar (mover o `onMessagesChange` para dentro do loop de parsing, no primeiro delta recebido)
- Usar uma flag `firstToken` para controlar isso

### Etapa 3: Reforcar o system prompt

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Adicionar diretriz mais explicita e enfatica no prompt:
```text
"REGRA CRITICA: Para cumprimentos como 'Oi', 'Ola', 'Tudo bem?', 'Quem sou eu?', voce DEVE responder em NO MAXIMO 1-2 frases curtas. NUNCA mencione dados da empresa, objetivos, KRs ou projetos a menos que o usuario EXPLICITAMENTE peca. Responda APENAS o que foi perguntado."
```

Adicionar exemplos concretos de resposta:
```text
Exemplos:
- Usuario: "Oi" -> "Ola, Bernardo! Como posso te ajudar hoje?"
- Usuario: "Quem sou eu?" -> "Voce e o Bernardo, [cargo] da [empresa]."
- Usuario: "O que e o Strategy?" -> [1-2 paragrafos sobre a plataforma]
- Usuario: "Analise meus OKRs" -> [resposta completa com dados]
```

---

## Detalhes Tecnicos

### Logica do primeiro token (Etapa 2)
```text
let firstTokenReceived = false;

// No loop de parsing:
if (delta) {
  fullContent += delta;
  if (!firstTokenReceived) {
    firstTokenReceived = true;
  }
  onMessagesChange([...updatedMessages, { role: 'assistant', content: fullContent, timestamp: new Date() }]);
}
```

Remover a linha 274 que faz `onMessagesChange([...updatedMessages, streamingMessage])` com conteudo vazio.

### Condicao do TypingIndicator (Etapa 1)
```text
// De:
{isLoading && <TypingIndicator />}

// Para:
{(isLoading || (isStreaming && !messages.some((m, i) => i === messages.length - 1 && m.role === 'assistant' && m.content))) && <TypingIndicator />}
```

Simplificando: mostrar "digitando" enquanto `isLoading` OU enquanto `isStreaming` e a ultima mensagem do assistente ainda nao tem conteudo.

### Arquivos a serem editados
1. `src/components/ai/FloatingAIChat.tsx` - Indicador de digitacao + remover bolha vazia
2. `supabase/functions/ai-chat/index.ts` - Reforcar prompt com exemplos e regra critica
