

## Redesign do Input do Atlas Chat — Estilo Lovable

### O que muda

O input atual e uma linha unica com botoes ao lado. O novo layout sera inspirado no Lovable:

**Estrutura do novo input:**
```text
+------------------------------------------+
|  Textarea auto-expansivel (1-5 linhas)   |
+------------------------------------------+
| [+]  [Plano]              [Mic] [Enviar] |
+------------------------------------------+
```

### Detalhes

**1. Textarea auto-expansivel**
- Comeca com 1 linha (~40px)
- Expande automaticamente conforme o usuario digita, ate no maximo 5 linhas (~120px)
- Apos 5 linhas, o texto rola internamente (overflow-y: auto)
- Enter envia, Shift+Enter quebra linha
- Mantém suporte a paste de imagens

**2. Barra de acoes abaixo**
- Esquerda: botao "+" (para futuro envio de midia/arquivos — por enquanto abre toast "Em breve")
- Esquerda: botao "Plano" (toggle, igual ao atual)
- Direita: botao Microfone + botao Enviar

**3. Novo comportamento do Microfone (gravar + transcrever)**
- Ao clicar no mic, inicia gravacao real de audio via `MediaRecorder` (nao mais SpeechRecognition live)
- Durante gravacao: exibe barras animadas de waveform dentro do textarea (estilo Lovable) + timer
- Botao de mic vira botao de parar (quadrado)
- Ao parar: exibe "Transcrevendo..." com spinner no textarea
- O audio gravado e enviado a uma nova Edge Function `transcribe-audio` que usa OpenAI Whisper
- O texto transcrito e inserido no textarea para o usuario revisar/editar antes de enviar

**4. Nova Edge Function: `transcribe-audio`**
- Recebe audio (base64 ou FormData)
- Envia para OpenAI Whisper API (`/v1/audio/transcriptions`) com model `whisper-1` e language `pt`
- Retorna o texto transcrito

### Alteracoes tecnicas

**Arquivo 1: `src/components/ai/FloatingAIChat.tsx`**

Na area de input (linhas 876-967):
- Substituir `<input>` por `<textarea>` com:
  - `rows={1}` inicial
  - `onInput` handler que calcula `scrollHeight` e ajusta `style.height` dinamicamente
  - `max-height` de ~120px (5 linhas), com `overflow-y: auto` apos isso
  - `resize: none` para desabilitar resize manual
- Mover botoes (Plan, Mic, Send) para uma div abaixo do textarea
- Adicionar botao "+" a esquerda dos botoes de acao
- Substituir logica de `toggleRecording`:
  - Usar `MediaRecorder` API em vez de `SpeechRecognition`
  - Armazenar chunks de audio em ref
  - Ao parar, converter para blob, enviar para edge function
- Adicionar estado `isTranscribing` para mostrar "Transcrevendo..." com spinner
- Adicionar animacao de barras de waveform durante gravacao (CSS puro com barras que oscilam)

**Arquivo 2: `supabase/functions/transcribe-audio/index.ts`** (novo)
- Cors headers padrao
- Recebe body JSON com `{ audio: string }` (base64)
- Converte base64 para blob
- Envia para `https://api.openai.com/v1/audio/transcriptions` como FormData
- Retorna `{ text: string }`

### Visual durante gravacao

Quando o mic esta ativo:
- O textarea mostra barras verticais animadas (8-12 barras com alturas aleatorias oscilando via CSS animation)
- Texto "Gravando..." abaixo das barras
- Fundo escuro com leve brilho ColorOrb

Quando para a gravacao:
- Barras somem
- Aparece "Transcrevendo..." com um spinner circular
- Apos transcricao, o texto aparece no textarea normalmente

### Sequencia de implementacao

1. Criar edge function `transcribe-audio`
2. Deploy da edge function
3. Redesenhar o input area no `FloatingAIChat.tsx` (textarea + layout de botoes + logica de gravacao/transcricao)
