
## Diagnostico e Correcao da Perda de Dados na Importacao

### Problema Identificado

A raiz do problema esta na **conversao XLSX** que corrompe campos JSONB. Especificamente:

- `monthly_targets` e `monthly_actual` dos Key Results contem objetos JSON como `{"2026-01": 1960000, "2026-02": 2400000, ...}`
- Na exportacao, esses objetos sao serializados como strings via `JSON.stringify()` e gravados em celulas XLSX
- Na importacao, ao ler o XLSX de volta com `sheet_to_json`, a biblioteca XLSX pode interpretar ou corromper essas strings JSON, resultando em objetos vazios `{}`
- Resultado: os 72 Key Results foram inseridos com sucesso (72/72), mas sem os dados de metas mensais

Tabelas como `kr_monthly_actions`, `kr_status_reports`, `kr_actions_history` e `key_result_values` estao com 0 registros porque a empresa Perville **nao possui dados** nessas tabelas (confirmado via consulta direta ao banco de dados da origem).

### Solucao Proposta

Adicionar suporte a **exportacao e importacao em formato JSON** (alem do XLSX existente). JSON preserva todos os tipos de dados sem perda, eliminando o problema de roundtrip do XLSX.

### Alteracoes

**1. Exportacao (`ExportCompanyDataCard.tsx`)**

- Alterar para exportar como arquivo `.json` em vez de `.xlsx`
- O JSON preserva campos JSONB nativamente, sem necessidade de serializacao/deserializacao manual
- O arquivo JSON contera todos os dados da empresa exatamente como retornados pela Edge Function
- Manter o nome do arquivo com padrao: `export_<empresa>_<data>.json`

**2. Importacao (`ImportCompanyDataModal.tsx`)**

- Aceitar arquivos `.json` alem de `.xlsx`
- Para `.json`: ler o arquivo diretamente como JSON e enviar os dados para a Edge Function
- Para `.xlsx`: manter o comportamento atual (compatibilidade retroativa)
- Na tela de upload, informar que `.json` e o formato recomendado

**3. Correcao do XLSX (retrocompatibilidade)**

- No `ImportCompanyDataModal`, ao ler o XLSX, usar a opcao `raw: true` no `sheet_to_json` para evitar coercao de tipos pela biblioteca
- Adicionar tratamento especial para campos que contenham objetos JSON serializados

### Detalhes Tecnicos

**ExportCompanyDataCard - Mudanca para JSON:**

```text
// Antes: conversao para XLSX com json_to_sheet
// Depois: download direto do JSON retornado pela Edge Function

const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
const url = URL.createObjectURL(blob);
// download como .json
```

Isso elimina completamente o problema de serializacao JSONB porque o JSON preserva os tipos nativamente.

**ImportCompanyDataModal - Suporte dual:**

```text
// Aceitar .json e .xlsx
accept=".json,.xlsx"

// Se .json:
//   - JSON.parse do conteudo do arquivo
//   - Usar data.data (ou data diretamente) como tables
//   - Enviar para edge function

// Se .xlsx:
//   - Manter fluxo atual com XLSX.read
//   - Usar { raw: true } em sheet_to_json para preservar strings
```

**Correcao do sheet_to_json:**

```text
// Antes:
const rows = XLSX.utils.sheet_to_json(sheet);

// Depois:
const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
```

A opcao `raw: true` retorna valores brutos sem coercao de tipo, preservando strings JSON como strings.

### Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/components/admin-v2/pages/companies/modals/ExportCompanyDataCard.tsx` | Exportar como JSON em vez de XLSX |
| `src/components/admin-v2/pages/companies/modals/ImportCompanyDataModal.tsx` | Aceitar JSON e XLSX, usar raw:true no XLSX |

### Impacto

- Novas exportacoes geram arquivos JSON (100% fidelidade dos dados)
- Importacoes de arquivos JSON funcionam sem perda de dados
- Importacoes de arquivos XLSX antigos continuam funcionando (com a correcao do raw:true)
- Nenhuma alteracao na Edge Function necessaria
