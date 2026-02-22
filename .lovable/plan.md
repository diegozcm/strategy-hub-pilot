

## Rastreabilidade Completa na Importacao

### Objetivo

Adicionar logs detalhados durante cada etapa da importacao e exibir um relatorio consolidado ao final, categorizando os resultados em: sucesso total, importacao parcial e falha completa, com detalhes dos erros.

### Alteracoes

**1. Edge Function (`supabase/functions/import-company-data/index.ts`)**

Melhorar o response da Edge Function para retornar dados mais granulares:
- Para cada tabela: total de linhas no arquivo, quantas foram inseridas, quantas falharam, e lista de erros com detalhes (batch index, mensagem de erro)
- Adicionar campo `skipped_rows` para rastrear linhas puladas por FK nao encontrada
- Incluir timestamps de inicio/fim por tabela
- Na fase de delete (modo replace), registrar quais tabelas foram limpas com sucesso e quais falharam

Estrutura do response aprimorada:
```text
results[table] = {
  total_in_file: number,
  inserted: number,
  skipped: number,
  failed: number,
  errors: [{ batch: number, message: string, row_ids: string[] }],
  skipped_details: [{ row_id: string, reason: string }]
}
```

**2. Frontend - Relatorio (`ImportCompanyDataModal.tsx`)**

Reescrever a tela de resultado (`renderResultStep`) para exibir tres secoes:

- **Importados com sucesso** (verde): tabelas onde todas as linhas foram inseridas sem erro
- **Importados parcialmente** (amarelo): tabelas onde parte das linhas foi inserida e parte falhou, mostrando quantas de quantas e os erros
- **Nao importados** (vermelho): tabelas presentes no arquivo que tiveram 0 insercoes, com o motivo da falha

Para cada tabela com erro, exibir:
- Nome da tabela (label amigavel)
- Contagem: X de Y registros
- Lista de erros expandivel com a causa e o batch onde ocorreu

**3. Frontend - Logs em tempo real durante o progresso**

Adicionar um log visual na tela de progresso que mostra as etapas conforme chegam. Como a Edge Function e uma unica chamada HTTP, os logs serao simulados no frontend:
- Antes de chamar: "Enviando dados para o servidor..."
- Apos resposta: "Processando resultado..."
- Mostrar na tela de resultado os logs do servidor (que vem no response)

### Detalhes Tecnicos

**Edge Function - Mudancas no response:**

```text
// Adicionar ao response:
{
  success: boolean,
  total_records: number,
  tables_imported: string[],
  results: {
    [table]: {
      total_in_file: number,   // NOVO
      inserted: number,
      skipped: number,         // NOVO - linhas puladas por FK
      failed: number,          // NOVO
      errors: [{ batch: number, message: string }],
      skipped_details: [{ old_id: string, reason: string }]  // NOVO
    }
  },
  errors: [...],
  delete_log: [{ table: string, success: boolean, error?: string }],  // NOVO
  duration_ms: number  // NOVO
}
```

**Frontend - Categorias do relatorio:**

- Sucesso total: `inserted === total_in_file && total_in_file > 0`
- Parcial: `inserted > 0 && inserted < total_in_file`
- Falha total: `inserted === 0 && total_in_file > 0`
- Tabelas ausentes no arquivo nao serao listadas

**Frontend - UI do relatorio:**

Usar acordeoes (Accordion) para cada categoria, com icones e cores distintas. Dentro de cada tabela com erro, listar os detalhes de forma expandivel para nao poluir a tela.

### Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/import-company-data/index.ts` | Enriquecer response com total_in_file, skipped, failed, skipped_details, delete_log, duration |
| `src/components/admin-v2/pages/companies/modals/ImportCompanyDataModal.tsx` | Reescrever renderResultStep com 3 categorias, erros expandiveis, e detalhes por tabela |

