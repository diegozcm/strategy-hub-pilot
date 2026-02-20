

## Diagnostico: Dados Perdidos na Importacao

### Resumo do Problema

A exportacao funciona corretamente (os dados existem no banco de origem). O problema esta na **conversao XLSX**, que perde colunas JSON e valores numericos calculados. A importacao por sua vez recebe dados incompletos e os insere como vazios.

### Analise Detalhada por Item Reportado

| Item faltando | Existe na origem? | Existe no XLSX? | Importado? | Causa raiz |
|---|---|---|---|---|
| Metas mensais (monthly_targets) | Sim (JSON com 12 meses) | Nao - coluna vazia no XLSX | Sim, mas como `{}` | XLSX nao serializa JSON corretamente |
| Valores realizados (monthly_actual) | Sim (JSON) | Nao - vazia | Sim, mas como `{}` | Mesmo problema |
| yearly_target / yearly_actual | Sim (30000000 / 2434806) | Nao - vazia | Sim, mas como `0` | Mesmo problema |
| Iniciativas (kr_initiatives) | **0 registros** na origem | N/A | N/A | Nao e bug - Perville nao tem |
| KR Status Reports | **0 registros** na origem | N/A | N/A | Nao e bug |
| KR Monthly Actions | **0 registros** na origem | N/A | N/A | Nao e bug |
| FCA | 5 registros | Sim | **5 importados** | Funciona OK |
| Projetos | 5 registros | Sim | **5 importados** | Funciona OK |
| Tasks | 19 registros | Sim | **19 importados** | Funciona OK |

### Causa Raiz Tecnica

O fluxo atual e:

```text
DB (JSON) --> Export Edge Function --> JSON Response --> Frontend XLSX.writeFile() --> .xlsx file
.xlsx file --> Frontend XLSX.read() --> sheet_to_json() --> Import Edge Function --> DB
```

O problema esta em **duas etapas**:

1. **Exportacao (Frontend - ExportCompanyDataCard.tsx)**: `XLSX.utils.json_to_sheet()` converte campos JSONB (como `monthly_targets: {"2026-01": 1960000, ...}`) em `[object Object]` na celula XLSX, pois XLSX nao suporta objetos aninhados nativamente.

2. **Importacao (Frontend - ImportCompanyDataModal.tsx)**: `XLSX.utils.sheet_to_json()` le essas celulas como strings vazias ou `[object Object]`, que sao inseridas no banco como objetos JSON vazios `{}` ou valores `0`.

### Dados Confirmados no Banco

Comparacao direta do KR "Margem (R$)":
- **Origem**: `monthly_targets = {"2026-01": 1960000, "2026-02": 2400000, ...}`, `yearly_target = 30000000`
- **Destino**: `monthly_targets = {}`, `yearly_target = 0`
- **target_value** e **current_value** foram preservados (campos numericos simples)

### Plano de Correcao

**Arquivo 1: `src/components/admin-v2/pages/companies/modals/ExportCompanyDataCard.tsx`**

Antes de gerar o XLSX, serializar todas as colunas que contem objetos JSON como strings JSON (usando `JSON.stringify`). Isso garante que o XLSX armazene o conteudo como texto legivel e recuperavel.

Colunas afetadas que precisam de serializacao:
- `monthly_targets` (key_results)
- `monthly_actual` (key_results)
- `strengths`, `weaknesses`, `opportunities`, `threats` (swot_analysis - podem ser arrays)
- `values` (companies - array)
- `settings` (company_module_settings)
- `previous_data`, `new_data` (kr_actions_history)
- `evidence_links` (kr_monthly_actions)
- Qualquer outro campo que contenha objetos/arrays

Logica: para cada tabela, iterar sobre cada linha e cada campo; se o valor for um objeto ou array, converter para `JSON.stringify(valor)`.

**Arquivo 2: `src/components/admin-v2/pages/companies/modals/ImportCompanyDataModal.tsx`**

Na leitura do XLSX, aplicar o processo inverso: detectar campos que contem strings JSON validas e converte-los de volta para objetos com `JSON.parse()`.

Logica: para cada tabela importada, iterar sobre cada linha e cada campo; se o valor for uma string que comeca com `{` ou `[`, tentar `JSON.parse()`. Se bem sucedido, substituir o campo pelo objeto parseado.

### Colunas JSONB conhecidas que precisam de tratamento especial

```text
key_results: monthly_targets, monthly_actual
swot_analysis: strengths, weaknesses, opportunities, threats
companies: values
company_module_settings: settings
kr_actions_history: previous_data, new_data
kr_monthly_actions: evidence_links
```

### Abordagem Alternativa Considerada

Uma alternativa seria mudar o formato de exportacao/importacao de XLSX para JSON puro (.json), o que preservaria perfeitamente todos os tipos de dados. Porem, como o formato XLSX ja e o padrao estabelecido e o usuario espera arquivos Excel, a solucao de serializar/deserializar JSON e a mais adequada para manter compatibilidade.

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---|---|
| `ExportCompanyDataCard.tsx` | Serializar campos JSON como strings antes de gerar o XLSX |
| `ImportCompanyDataModal.tsx` | Deserializar strings JSON de volta para objetos ao ler o XLSX |

### Observacao

Os itens "iniciativas", "status reports" e "acoes mensais" reportados como faltantes **nao sao bugs** - a empresa Perville genuinamente nao possui registros nessas tabelas (0 registros na origem).

