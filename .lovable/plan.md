

## Melhoria nos nomes dos arquivos exportados

### Problema atual

O nome atual dos arquivos exportados fica assim:
- `Tabela_RMRE_-_YTD_2026-02-09.xlsx`

O regex `replace(/\s+/g, '_')` substitui todos os espacos por underscores, mas mantem o hifen isolado, resultando em `_-_` que fica feio.

### Solucao

Alterar a logica de geracao do nome do arquivo em `src/components/indicators/ExportModal.tsx` para produzir nomes mais limpos, como:

**RMRE_YTD_2026-02-09.xlsx**

Mudancas:
1. Remover o prefixo "Tabela" redundante
2. Substituir sequencias de caracteres especiais (espacos, hifens) por um unico underscore
3. Limpar underscores duplicados

O replace passaria a ser:
```typescript
title.replace(/[\s\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
```

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/indicators/ExportModal.tsx` | Melhorar o regex de sanitizacao do nome nos 3 exports (PNG, PDF, XLSX) |
| `src/components/indicators/KRTableView.tsx` | Alterar o title de `"Tabela RMRE - YTD"` para `"RMRE YTD"` (mais limpo) |

### Resultado esperado

| Antes | Depois |
|-------|--------|
| `Tabela_RMRE_-_YTD_2026-02-09.xlsx` | `RMRE_YTD_2026-02-09.xlsx` |
| `Tabela_RMRE_-_YTD_2026-02-09.pdf` | `RMRE_YTD_2026-02-09.pdf` |
| `Tabela_RMRE_-_YTD_2026-02-09.png` | `RMRE_YTD_2026-02-09.png` |

