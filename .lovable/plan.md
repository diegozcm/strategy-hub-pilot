
## Correcao da Importacao de Dados

### Problema Identificado

A Edge Function `import-company-data` define todas as colunas de referencia a usuarios (`created_by`, `changed_by`, `owner_id`, `uploaded_by`, etc.) como `NULL`. Porem, muitas dessas colunas possuem constraint `NOT NULL` no banco de dados, o que causa falha em praticamente todos os inserts.

**Resultado:** Apenas 9 de 1150 registros foram importados (somente tabelas sem colunas de usuario obrigatorias).

### Correcoes

**1. Edge Function `import-company-data/index.ts`**

Alterar a logica de tratamento de colunas de usuario: em vez de definir como `NULL`, atribuir o ID do admin que esta realizando a importacao (`userId`).

Trecho atual:
```javascript
// Nullify user reference columns
for (const col of USER_COLUMNS) {
  if (col in newRow && newRow[col]) {
    newRow[col] = null;
  }
}
```

Correcao:
```javascript
// Set user reference columns to importing admin's ID
for (const col of USER_COLUMNS) {
  if (col in newRow && newRow[col]) {
    newRow[col] = userId;
  }
}
```

Isso garante que:
- Colunas NOT NULL sao satisfeitas
- Os registros importados ficam atribuidos ao admin que executou a importacao
- A rastreabilidade e mantida

**2. Icon do modal `ImportCompanyDataModal.tsx`**

Trocar o icone `Upload` por `Download` no header do modal, para consistencia com o card de importacao que ja usa `Download`.

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/import-company-data/index.ts` | Trocar `null` por `userId` nas colunas de usuario |
| `src/components/admin-v2/pages/companies/modals/ImportCompanyDataModal.tsx` | Trocar icone `Upload` por `Download` no header |
