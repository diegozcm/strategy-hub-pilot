
# Switch de Modelo: Plan Mode usa Gemini Pro

## Resumo

Quando o botao "Plan" estiver ativado, o sistema usara o modelo `google/gemini-2.5-pro` (raciocinio avancado, respostas mais completas). Com Plan desativado, continua usando o modelo configurado nas settings (default: `google/gemini-3-flash-preview`).

## Mudancas

### 1. Frontend: Enviar flag `plan_mode` para o backend

**Arquivo: `src/components/ai/FloatingAIChat.tsx`** (~linha 505)

Adicionar `plan_mode: isPlanMode` no body do fetch:

```
body: JSON.stringify({
  message: effectiveMessage,
  session_id: currentSessionId,
  user_id: user.id,
  company_id: company.id,
  stream: true,
  plan_mode: isPlanMode,   // <-- NOVO
  ...(pastedImages.length > 0 ? { image: pastedImages[0] } : {}),
})
```

### 2. Backend: Usar modelo Pro quando plan_mode = true

**Arquivo: `supabase/functions/ai-chat/index.ts`** (~linha 323-327)

Extrair `plan_mode` do body e sobrescrever o modelo:

```
const { plan_mode } = await req.json(); // ja desestruturado junto com message, etc.

const rawModel = aiSettings?.model || 'google/gemini-3-flash-preview';
const model = plan_mode
  ? 'google/gemini-2.5-pro'
  : (allowedModels.includes(rawModel) ? rawModel : 'google/gemini-3-flash-preview');
```

Tambem aumentar `max_tokens` no modo Plan para evitar respostas truncadas:

```
const maxTokens = plan_mode ? 4000 : (aiSettings?.max_tokens || 2000);
```

## Resultado

- Plan ON: Gemini 2.5 Pro (raciocinio profundo, respostas completas, JSON mais preciso)
- Plan OFF: Gemini Flash (rapido e economico para conversas normais)
- Tokens aumentados no modo Plan para evitar cortes no JSON
