

# Humanizar o Account Pilot: Respostas Inteligentes e Indicador de Digitacao

## Problema Atual

1. **Respostas sempre longas**: O system prompt atual obriga a IA a responder "baseando-se EXCLUSIVAMENTE nos dados" e o contexto completo da empresa e sempre anexado a TODA mensagem -- ate um simples "ola". Isso faz a IA responder com analises detalhadas mesmo para cumprimentos simples.

2. **Loading generico**: Enquanto a IA processa, aparece apenas um spinner generico. Nao ha indicacao visual de "digitando" como no WhatsApp, o que faz parecer lento e impessoal.

3. **Sem streaming**: A resposta so aparece quando esta 100% pronta. Em mensagens longas isso pode levar varios segundos de espera sem feedback.

---

## Plano de Acao

### Etapa 1: Reformular o System Prompt para calibrar tamanho da resposta

**Arquivo**: `supabase/functions/ai-chat/index.ts`

O novo system prompt vai instruir a IA a:
- Responder de forma curta e direta para cumprimentos e perguntas simples ("Ola!", "Quem sou eu?", "O que e o Strategy?")
- Responder de forma media para perguntas conceituais sobre a plataforma (sem precisar do banco)
- Responder de forma detalhada apenas quando o usuario pedir analise de dados, metricas ou diagnosticos
- Nunca despejar dados nao solicitados

Nova diretriz central:
```text
"Calibre o tamanho da sua resposta conforme a complexidade da pergunta:
- Cumprimentos e perguntas simples: responda em 1-2 frases, de forma amigavel e direta.
- Perguntas sobre a plataforma ou conceitos: responda em 1-2 paragrafos objetivos.
- Analises de dados, diagnosticos e metricas: use os dados contextuais disponibilizados abaixo e responda de forma completa com formatacao markdown.
NAO despeje dados ou analises que o usuario nao pediu."
```

### Etapa 2: Separar dados contextuais da mensagem do usuario

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Atualmente, os dados da empresa sao injetados DENTRO da mensagem do usuario (`contextPrompt`), forcando a IA a sempre analisar tudo. A mudanca:
- Mover os dados contextuais para uma mensagem de sistema separada (role: "system"), como contexto de referencia
- Enviar a mensagem do usuario pura, sem os dados embutidos
- Instruir no system prompt: "Use os dados contextuais abaixo SOMENTE quando o usuario solicitar analises, metricas ou diagnosticos"

Estrutura de mensagens:
```text
[system] -> Prompt principal com diretrizes e identidade
[system] -> Dados contextuais da empresa (para referencia)
[historico de mensagens anteriores]
[user] -> Mensagem pura do usuario (sem dados embutidos)
```

### Etapa 3: Implementar streaming SSE no backend

**Arquivo**: `supabase/functions/ai-chat/index.ts`

- Adicionar parametro `stream: true` na chamada ao AI Gateway quando o body da requisicao incluir `stream: true`
- Retornar o body da resposta como stream SSE diretamente para o frontend
- Manter o modo nao-streaming como fallback (para salvar analytics e mensagens no banco)

Decisao de design: Usar streaming completo com salvamento da mensagem ao final. O backend faz stream da resposta, e ao final do stream o frontend envia a mensagem completa para salvar no banco.

### Etapa 4: Indicador "digitando..." estilo WhatsApp

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

Substituir o spinner generico por uma animacao de tres pontinhos pulsantes:
```text
Account Pilot
  [bolinha] [bolinha] [bolinha]   <- animacao CSS pulsante
  "digitando..."
```

Usando CSS `@keyframes` com `animation-delay` escalonado nos tres pontinhos para criar o efeito de "onda" do WhatsApp.

### Etapa 5: Implementar streaming SSE no frontend

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

- Ao enviar mensagem, fazer `fetch` direto para a edge function com `stream: true`
- Processar SSE linha por linha (conforme padrao do Lovable AI)
- Renderizar tokens progressivamente na tela (a mensagem do assistente vai "aparecendo" em tempo real)
- Ao receber `[DONE]`, salvar a mensagem completa no banco

Fluxo:
```text
1. Usuario envia mensagem
2. Mostra indicador "digitando..."
3. Primeiro token chega -> substitui indicador por mensagem real
4. Tokens vao sendo adicionados ao vivo
5. Stream termina -> salva no banco
```

### Etapa 6: Treinamento do agente sobre a plataforma

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Adicionar ao system prompt conhecimento embutido sobre o COFOUND/Strategy HUB para que a IA responda perguntas sobre a plataforma sem precisar consultar o banco:
- O que e o Strategy HUB e suas funcionalidades
- Menus disponiveis (Mapa Estrategico, OKRs, Projetos, FCA, RMRE, etc.)
- O que e o Account Pilot
- Como usar cada ferramenta

---

## Arquivos a serem editados

1. `supabase/functions/ai-chat/index.ts` - System prompt + separacao de contexto + streaming SSE + conhecimento da plataforma
2. `src/components/ai/FloatingAIChat.tsx` - Indicador "digitando..." + streaming frontend + renderizacao progressiva

## Resultado Esperado

- "Ola" -> resposta em ~1 segundo: "Ola, Bernardo! Como posso te ajudar?"
- "O que e o Strategy?" -> resposta em ~2 segundos com explicacao concisa
- "Me de uma analise da performance" -> resposta em ~5-8 segundos com dados reais, renderizados progressivamente enquanto sao gerados

