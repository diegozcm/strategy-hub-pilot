
## Correcao do Erro de Importacao e Validacao via Atlas AI

### Problema 1: Crash "Cannot read properties of null (reading '2026-01')"

O erro acontece porque os Key Results importados tem `monthly_targets` e `monthly_actual` como `NULL` no banco de dados. Varios componentes acessam esses campos assumindo que sao objetos (ex: `KROverviewModal.tsx` linha 216: `currentKeyResult.monthly_targets as Record<string, number> || {}`). Quando o valor e `null`, o cast `as Record` nao muda o valor em runtime, mas o operador `||` deveria proteger. No entanto, ha outros locais onde o acesso e feito sem protecao.

**Causa raiz dos dados NULL**: A importacao foi feita com um arquivo XLSX antigo (anterior a correcao para JSON). O XLSX corrompe campos JSONB. A solucao definitiva e re-exportar em JSON e re-importar, mas precisamos tambem:

1. Proteger a UI contra `monthly_targets = null` (null safety)
2. Adicionar logging de debug na edge function para diagnosticar futuros problemas
3. Implementar validacao via Atlas AI

### Alteracoes

**1. Edge Function de importacao - Debug logging (`import-company-data/index.ts`)**

Adicionar logs de debug para tabelas criticas (key_results) mostrando uma amostra dos dados recebidos antes de inserir, especificamente campos JSONB:
- Log do primeiro registro de cada tabela mostrando se `monthly_targets` esta presente e seu tipo
- Apos insercao, verificar no banco se os dados foram persistidos corretamente para key_results

**2. Null safety nos componentes que acessam monthly_targets/monthly_actual**

Adicionar protecao contra null em todos os pontos criticos:
- `KROverviewModal.tsx`: usar `?? {}` em vez de `|| {}` apos cast
- `DashboardHome.tsx`: mesma correcao
- `useRumoCalculations.tsx`: mesma correcao
- `useStrategicMap.tsx`: mesma correcao
- Todos os outros componentes que fazem cast de `monthly_targets`

A correcao e simples: trocar `as Record<string, number> || {}` por `as Record<string, number> ?? {}` ou, melhor, usar `(kr.monthly_targets ?? {}) as Record<string, number>`.

**3. Edge Function de validacao de importacao (`validate-import`)**

Criar uma nova Edge Function `validate-import` que:
- Recebe o JSON exportado original e o company_id de destino
- Consulta os dados importados no banco
- Compara campo a campo, tabela a tabela
- Para key_results: verifica especificamente se `monthly_targets` e `monthly_actual` foram preservados
- Retorna um relatorio detalhado com discrepancias

**4. Integracao com Atlas AI para analise pos-importacao**

Apos a importacao finalizar com sucesso no `ImportCompanyDataModal`, adicionar um botao "Validar com Atlas" que:
- Chama a edge function `validate-import` com o JSON original e o company_id
- Envia o resultado da validacao para o Atlas AI (via `ai-chat`) com um prompt especifico de analise
- O Atlas analisa as discrepancias e sugere correcoes
- Se encontrar campos JSONB corrompidos, o Atlas pode propor um plano de correcao via `[ATLAS_PLAN]` com acoes `update_key_result` para restaurar os dados

**5. Auto-correcao no import edge function**

Adicionar validacao de campos JSONB apos a insercao de key_results:
- Apos inserir cada batch de key_results, consultar os registros inseridos
- Se `monthly_targets` for null mas o dado original tinha valor, tentar um UPDATE separado
- Registrar no log se houve necessidade de correcao

### Detalhes Tecnicos

**Nova Edge Function: `validate-import`**

```text
Entrada: {
  company_id: string,
  source_data: { key_results: [...], ... }  // JSON original
}

Saida: {
  valid: boolean,
  tables_checked: number,
  discrepancies: [
    {
      table: string,
      field: string,
      source_id: string,
      imported_id: string,
      source_value: any,
      imported_value: any,
      status: "match" | "mismatch" | "missing"
    }
  ],
  summary: {
    total_fields_checked: number,
    matches: number,
    mismatches: number,
    missing: number
  }
}
```

**Botao "Validar com Atlas" no resultado da importacao:**

Apos o relatorio de importacao, exibir um botao que:
1. Chama `validate-import` com os dados originais
2. Se houver discrepancias, mostra um resumo e oferece enviar para o Atlas
3. O Atlas recebe as discrepancias e sugere correcoes automaticas via `[ATLAS_PLAN]`

**Null safety - padrao a usar em todos os componentes:**

```text
// Antes (crash quando null):
const monthlyTargets = currentKeyResult.monthly_targets as Record<string, number> || {};

// Depois (seguro contra null):
const monthlyTargets = (currentKeyResult.monthly_targets ?? {}) as Record<string, number>;
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/import-company-data/index.ts` | Adicionar debug logging para campos JSONB e auto-correcao pos-insert |
| `supabase/functions/validate-import/index.ts` | **NOVO** - Edge function de validacao comparativa |
| `src/components/admin-v2/pages/companies/modals/ImportCompanyDataModal.tsx` | Adicionar botao "Validar com Atlas" no resultado |
| `src/components/strategic-map/KROverviewModal.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/components/dashboard/DashboardHome.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/hooks/useRumoCalculations.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/hooks/useStrategicMap.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/hooks/useKRMetrics.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/components/strategic-map/KRUpdateValuesModal.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/components/strategic-map/KREditModal.tsx` | Null safety para monthly_targets/monthly_actual |
| `src/lib/krHelpers.ts` | Null safety para monthly_targets/monthly_actual |
| `supabase/config.toml` | Registrar nova funcao validate-import |

### Sequencia de Implementacao

1. Corrigir null safety em todos os componentes (resolve o crash imediato)
2. Adicionar debug logging na edge function de import
3. Criar edge function `validate-import`
4. Integrar botao de validacao no modal de importacao
5. Deploy e teste
