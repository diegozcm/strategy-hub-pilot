
# Regras de Governanca — Documento Unico + Integracao Atlas

## Resumo

Substituir o sistema atual de regras de governanca (texto + lista de itens) por um sistema de **upload de documento unico** (PDF, DOCX, XLSX, etc.) que pode ser visualizado inline na pagina e em tela cheia, com opcoes de baixar, trocar e remover. Somente gestores (manager/admin) podem gerenciar o documento. Alem disso, integrar os dados de governanca (calendario, pautas, reunioes, atas e regras) ao contexto da IA Atlas.

---

## Etapa 1 — Banco de Dados e Storage

### 1.1 Criar bucket de storage `governance-documents`

Bucket privado para armazenar os documentos de regras de governanca.

### 1.2 Criar tabela `governance_rule_documents`

Nova tabela para registrar o documento unico por empresa:

```text
governance_rule_documents
  id: uuid (PK)
  company_id: uuid (FK -> companies, UNIQUE)
  file_name: text
  file_path: text (caminho no storage)
  file_type: text (mime type)
  file_size: bigint
  uploaded_by: uuid (FK -> auth.users)
  created_at: timestamptz
  updated_at: timestamptz
```

A constraint UNIQUE em `company_id` garante que cada empresa tenha no maximo UM documento.

### 1.3 RLS Policies

- SELECT: qualquer usuario da empresa pode visualizar
- INSERT/UPDATE/DELETE: somente gestores (manager/admin) do modulo Strategy HUB

### 1.4 Storage Policies

- SELECT (download): usuarios da empresa
- INSERT/UPDATE/DELETE: gestores da empresa

---

## Etapa 2 — Hook `useGovernanceRuleDocument`

Novo hook que substitui o `useGovernanceRules` na secao de regras:

- **query**: busca o registro em `governance_rule_documents` para a empresa atual
- **upload**: faz upload do arquivo para `governance-documents/{company_id}/{filename}`, insere/atualiza o registro na tabela, remove arquivo antigo se houver
- **replace**: mesma logica do upload, removendo o anterior
- **remove**: deleta o arquivo do storage e o registro da tabela
- **getPublicUrl**: gera URL assinada para visualizacao/download

---

## Etapa 3 — Componente `GovernanceRulesSection` (reescrita)

Substituir completamente o componente atual. Novo comportamento:

### Estado: Sem documento
- Exibe area de upload com drag-and-drop e botao "Selecionar arquivo"
- Aceita: PDF, DOCX, XLSX, PPTX, etc.
- Visivel apenas para gestores; members veem mensagem "Nenhum documento cadastrado"

### Estado: Com documento
- **Preview inline**: Para PDFs, exibe usando `<iframe>` ou `<object>` com a URL assinada. Para outros tipos, exibe um card com icone do tipo de arquivo, nome e tamanho
- **Botao "Visualizar em tela cheia"**: abre um Dialog fullscreen com o documento em `<iframe>` (PDFs) ou link de download (outros formatos)
- **Botao "Baixar"**: download direto do arquivo
- **Botao "Trocar"** (somente gestores): abre seletor de arquivo para substituir
- **Botao "Remover"** (somente gestores): confirma e remove o documento

### Permissoes
- Usar `PermissionGate` ou checar `canEdit` do `useCurrentModuleRole` para esconder botoes de trocar/remover de members

---

## Etapa 4 — Integracao com IA Atlas

### 4.1 Edge Function `ai-chat/index.ts`

No bloco onde se constroi o `contextData` (linhas 385-438), adicionar queries para as tabelas de governanca:

```text
governance_meetings  -> titulo, tipo, data, status (ultimas 10)
governance_atas      -> conteudo, decisoes, participantes (ultimas 5)
governance_agenda_items -> titulo, status, responsavel (vinculados as reunioes acima)
governance_rule_documents -> file_name (so o nome do documento, nao o conteudo)
```

Adicionar ao `contextParts` uma secao:

```text
📋 Governanca RMRE:
• Proximas reunioes: [lista]
• Ultimas atas: [resumo de decisoes]
• Documento de regras: [nome do arquivo]
```

### 4.2 Edge Function `generate-insights/index.ts`

Mesma logica: buscar dados de governanca e incluir no prompt de diagnostico para que os insights considerem a saude da governanca (reunioes atrasadas, atas pendentes, etc.).

---

## Etapa 5 — Limpeza

- Remover o hook `useGovernanceRules.tsx` (nao sera mais necessario)
- Opcionalmente, as tabelas `governance_rules` e `governance_rule_items` podem ser mantidas temporariamente para nao perder dados existentes, mas nao serao mais consumidas pela UI

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar bucket, tabela, RLS e storage policies |
| `src/hooks/useGovernanceRuleDocument.tsx` | **Novo** — hook para upload/download/remocao |
| `src/components/tools/governance/GovernanceRulesSection.tsx` | **Reescrever** — de lista de texto para visualizador de documento |
| `supabase/functions/ai-chat/index.ts` | **Editar** — adicionar queries de governanca ao contexto |
| `supabase/functions/generate-insights/index.ts` | **Editar** — adicionar dados de governanca ao diagnostico |
| `src/hooks/useGovernanceRules.tsx` | **Remover** (apos migracao) |

---

## Detalhes Tecnicos

### Visualizacao de PDF inline

Para PDFs, usar `<iframe src={signedUrl} />` com fallback para download. O Supabase Storage gera URLs assinadas que funcionam em iframes.

### Tipos de arquivo suportados para preview

- **PDF**: iframe inline + tela cheia
- **Outros (DOCX, XLSX, PPTX)**: card com icone + download direto (navegadores nao renderizam esses formatos nativamente)

### URL Assinada

Usar `supabase.storage.from('governance-documents').createSignedUrl(path, 3600)` para gerar URLs temporarias de 1h para visualizacao.
