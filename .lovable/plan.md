
# Plano: Correção do Tratamento de Erros na Criação de Usuários

## Problema Identificado

O usuário tentou criar um usuário com email `bernardoruschi@gmail.com`, mas esse email **já existe no sistema**. A edge function `create-user-admin` retornou corretamente:

```json
{
  "success": false,
  "error": "Usuário com este email já existe"
}
```

Com status HTTP **422**. Porém, o frontend exibe:

> "Erro ao criar usuário - Erro de comunicação com o servidor"

### Causa Raiz

O código em `CreateUserPage.tsx` (linhas 356-378) tenta extrair a mensagem de erro incorretamente:

```typescript
// Código atual INCORRETO:
const errorContext = (createError as any).context;
if (errorContext?.body) {
  const parsed = JSON.parse(errorContext.body);  // ❌ body não existe!
  errorMessage = parsed.error || errorMessage;
}
```

De acordo com a documentação oficial do Supabase, para erros de edge functions com status não-2xx, deve-se usar:

```typescript
import { FunctionsHttpError } from '@supabase/supabase-js'

if (error instanceof FunctionsHttpError) {
  const errorMessage = await error.context.json()  // ✅ Método assíncrono
}
```

## Logs da Edge Function (Confirmação)

```
2026-02-04T20:06:17Z INFO User already exists: bernardoruschi@gmail.com
2026-02-04T20:06:17Z INFO ✅ User bernardo.bruschi@cofound.com.br authorized as system admin
```

A edge function funciona corretamente - o problema é exclusivamente no frontend.

## Solução

Atualizar o tratamento de erros em `CreateUserPage.tsx` para usar a API correta do Supabase SDK.

## Detalhamento Técnico

### Arquivo: `src/components/admin-v2/pages/users/CreateUserPage.tsx`

#### Mudança 1: Adicionar import

```typescript
// Adicionar no topo do arquivo (linha 12)
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
```

#### Mudança 2: Corrigir tratamento de erro

Substituir linhas 356-378 por:

```typescript
// Handle edge function errors (including 422 business errors)
if (createError) {
  console.error('Edge function error:', createError);
  let errorMessage = 'Erro de comunicação com o servidor.';
  
  try {
    if (createError instanceof FunctionsHttpError) {
      // Para erros HTTP da edge function, extrair o JSON da resposta
      const errorData = await createError.context.json();
      console.log('Edge function error data:', errorData);
      errorMessage = errorData?.error || errorMessage;
    } else if (createError instanceof FunctionsRelayError) {
      errorMessage = `Erro de relay: ${createError.message}`;
    } else if (createError instanceof FunctionsFetchError) {
      errorMessage = `Erro de conexão: ${createError.message}`;
    } else if ((createError as any).message) {
      errorMessage = (createError as any).message;
    }
  } catch (parseError) {
    console.error('Error parsing edge function error:', parseError);
  }
  
  if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
    throw new Error('Este e-mail já está cadastrado no sistema.');
  }
  throw new Error(errorMessage);
}
```

### Verificação em Outro Arquivo

Verificar se há o mesmo problema em `src/components/admin/CreateUserPage.tsx` (versão antiga) - deve receber a mesma correção.

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin-v2/pages/users/CreateUserPage.tsx` | Corrigir import e tratamento de erros |
| `src/components/admin/CreateUserPage.tsx` | Aplicar mesma correção (se necessário) |

## Verificação Pós-Implementação

1. ✅ Criar usuário com email novo → sucesso
2. ✅ Tentar criar usuário com email existente → exibe "Este e-mail já está cadastrado no sistema"
3. ✅ Erros de conexão → exibe "Erro de conexão: ..."
4. ✅ Erros de permissão → exibe "Permissão negada..."
