

# Correção: Edge Function `generate-insights` não inicia

## Problema
A edge function `generate-insights` tem um `import { createClient }` duplicado nas linhas 2 e 3, causando:
```
Uncaught SyntaxError: Identifier 'createClient' has already been declared
```
A função nem sequer inicializa — toda chamada falha.

## Correção
Remover a linha 3 (import duplicado) de `supabase/functions/generate-insights/index.ts`.

**Antes:**
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'; // ← duplicada
```

**Depois:**
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
```

## Arquivo Impactado
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-insights/index.ts` | Remover import duplicado (linha 3) |

Após a correção, re-deploy da função.

