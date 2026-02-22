
## Correcao: Atlas nao consegue definir Taxa de Variacao nos KRs

### Diagnostico

O problema tem duas causas raiz:

1. **Campo ignorado no executor** (`ai-agent-execute/index.ts`, linhas 515-526): O handler de `update_key_result` mapeia campos como `current_value`, `monthly_actual`, `weight`, etc., mas **nao inclui `variation_threshold`**. Quando o Atlas envia esse campo, ele e silenciosamente descartado.

2. **Campo desconhecido pelo Atlas** (`ai-chat/index.ts`, linha 154): O system prompt lista os campos de `update_key_result` como "current_value, target_value, monthly_actual, monthly_targets, etc." sem mencionar `variation_threshold`. O Atlas inventa nomes como `target_variation_value` ou `comparison_type` que nao existem no banco.

### Correcoes

**Arquivo 1: `supabase/functions/ai-agent-execute/index.ts`**

Adicionar o mapeamento do campo `variation_threshold` no bloco de update do KR (apos a linha 525):

```
if (d.variation_threshold !== undefined) updateData.variation_threshold = d.variation_threshold;
```

Tambem aceitar aliases que o Atlas possa gerar:

```
const variationVal = d.variation_threshold ?? d.target_variation_value ?? d.variation_rate;
if (variationVal !== undefined) updateData.variation_threshold = variationVal;
```

**Arquivo 2: `supabase/functions/ai-chat/index.ts`**

Atualizar a documentacao do `update_key_result` no system prompt para listar explicitamente o campo:

```
6. **update_key_result** — Atualiza um KR existente
   - Campos: kr_id ou kr_title, current_value, target_value, monthly_actual, monthly_targets, yearly_target, frequency, unit, description, weight, due_date, variation_threshold (numero em % ou null para desativar)
```

Tambem incluir a informacao de `variation_threshold` no contexto dos KRs existentes, para que o Atlas veja o estado atual de cada KR.

**Deploy**: Redeployar ambas as edge functions `ai-agent-execute` e `ai-chat`.

### Resultado Esperado

Apos a correcao, quando o usuario pedir ao Atlas para "ativar taxa de variacao de 10% no KR X", o Atlas gerara:

```json
{
  "type": "update_key_result",
  "data": {
    "kr_title": "X",
    "variation_threshold": 10
  }
}
```

E o executor salvara corretamente o valor no banco de dados.
