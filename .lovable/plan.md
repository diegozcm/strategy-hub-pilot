

## Importacao de Dados de Empresa

### Visao Geral

Criar uma funcionalidade completa de importacao de dados para empresas, acessivel pelo painel de System Admin. O usuario faz upload de um arquivo XLSX (gerado pela exportacao existente), visualiza um resumo dos dados, escolhe o modo de importacao (adicionar ou substituir) e confirma a operacao com dupla confirmacao antes da execucao.

---

### Fluxo do Usuario

1. Na aba "Acoes" da modal de detalhes da empresa, clicar no card "Importar Dados"
2. Modal de importacao abre com area de upload de arquivo XLSX
3. Apos selecionar o arquivo, o sistema le o XLSX no front-end e exibe um resumo:
   - Nome da empresa de origem (se disponivel na aba "companies")
   - Quantidade de tabelas e registros encontrados por categoria
4. O usuario escolhe o modo de importacao:
   - **Adicionar (merge):** insere os novos registros sem alterar os dados existentes da empresa destino
   - **Substituir (replace):** apaga todos os dados estrategicos/operacionais da empresa destino antes de inserir os novos
5. Primeira confirmacao: botao "Iniciar Importacao"
6. Segunda confirmacao (AlertDialog): aviso explicito sobre a acao, especialmente no modo "substituir" que e destrutivo
7. Execucao com barra de progresso e feedback em tempo real
8. Resultado final: sucesso com resumo ou erro com detalhes

---

### Componentes Front-End

**1. `ImportCompanyDataCard.tsx`** (novo)
- Card na aba "Acoes" ao lado do ExportCompanyDataCard
- Icone Upload, titulo "Importar Dados"
- Ao clicar, abre a modal de importacao

**2. `ImportCompanyDataModal.tsx`** (novo)
- Modal com etapas (wizard):
  - **Etapa 1 - Upload:** area de drag-and-drop ou seletor de arquivo .xlsx
  - **Etapa 2 - Resumo:** tabela mostrando categorias, quantidade de registros, e preview dos dados
  - **Etapa 3 - Modo:** radio buttons para "Adicionar aos dados existentes" vs "Substituir todos os dados"
  - **Etapa 4 - Confirmacao:** AlertDialog com aviso final
  - **Etapa 5 - Progresso:** barra de progresso e status da importacao
  - **Etapa 6 - Resultado:** resumo do que foi importado com sucesso/erros

---

### Edge Function: `import-company-data`

**Endpoint:** POST  
**Body:**
```json
{
  "company_id": "uuid-destino",
  "mode": "merge" | "replace",
  "data": { ... } // mesmo formato do export
}
```

**Logica principal:**

1. Validar autenticacao e permissao de System Admin (mesmo padrao do export)
2. Validar que `company_id` destino existe
3. Validar estrutura do payload (tabelas conhecidas, formato correto)
4. Se modo = "replace":
   - Deletar dados na ordem inversa de dependencia (filhos antes de pais):
     - `kr_actions_history`, `kr_monthly_actions`, `kr_fca`, `kr_status_reports`, `key_result_values`, `key_results_history`
     - `key_results`, `strategic_objectives`, `strategic_pillars`
     - `beep_answers`, `beep_assessments`
     - `governance_rule_items`, `governance_rules`, `governance_rule_documents`
     - `governance_atas`, `governance_agenda_items`, `governance_meetings`
     - `project_kr_relations`, `project_objective_relations`, `project_tasks`, `project_members`, `strategic_projects`
     - `kr_initiatives`
     - `vision_alignment_objectives`, `vision_alignment_history`, `vision_alignment`, `vision_alignment_removed_dupes`
     - `swot_history`, `swot_analysis`
     - `golden_circle_history`, `golden_circle`
     - `strategic_plans`
     - `company_module_settings`
   - NAO deleta a tabela `companies` (apenas atualiza se necessario)
5. Remapear IDs: gerar novos UUIDs para cada registro, mantendo um mapa old_id -> new_id para preservar as relacoes entre tabelas (foreign keys)
6. Substituir `company_id` de origem pelo `company_id` destino em todos os registros
7. Inserir dados na ordem correta de dependencia (pais antes de filhos):
   - `companies` (update, nao insert), `strategic_plans`, `golden_circle`, `swot_analysis`, `vision_alignment`...
   - Depois filhos: `strategic_pillars`, `strategic_objectives`, `key_results`...
   - Depois netos: `key_result_values`, `kr_fca`, etc.
8. Registrar log de importacao na tabela `company_import_logs`
9. Retornar resumo com contagens de sucesso/erro por tabela

**Mapeamento de IDs (critico):**

Para cada tabela, ao inserir:
- Gerar novo UUID para o campo `id`
- Guardar mapa: `originalId -> novoId`
- Ao inserir tabelas filhas, substituir as foreign keys usando o mapa
- Exemplo: `key_results.objective_id` -> buscar no mapa de `strategic_objectives`

---

### Tabela de Log: `company_import_logs`

```sql
CREATE TABLE public.company_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  admin_user_id uuid NOT NULL,
  import_mode text NOT NULL, -- 'merge' ou 'replace'
  source_company_name text,
  source_company_id text,
  tables_imported text[],
  total_records integer DEFAULT 0,
  errors jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system admins can access import logs"
  ON public.company_import_logs FOR ALL
  USING (public.is_system_admin(auth.uid()));
```

---

### Validacoes e Seguranca

- Apenas System Admins podem executar a importacao
- Arquivo deve ser .xlsx com abas que correspondam aos nomes de tabelas conhecidos
- Abas com nomes desconhecidos sao ignoradas (com aviso)
- No modo "replace", campos `created_by` e `updated_by` que referenciam usuarios sao setados como NULL (usuarios da empresa de origem nao existem no destino)
- Limite de tamanho do payload: o front-end processa o XLSX e envia apenas o JSON
- Transacao: toda a operacao de delete+insert no modo "replace" e feita de forma sequencial com tratamento de erro por tabela

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/import-company-data/index.ts` | Criar - Edge Function de importacao |
| `src/components/admin-v2/pages/companies/modals/ImportCompanyDataCard.tsx` | Criar - Card de acao |
| `src/components/admin-v2/pages/companies/modals/ImportCompanyDataModal.tsx` | Criar - Modal wizard com upload, resumo, modo, confirmacao e progresso |
| `src/components/admin-v2/pages/companies/modals/CompanyDetailsModal.tsx` | Modificar - Adicionar ImportCompanyDataCard na aba Acoes |
| Migration SQL | Criar - Tabela `company_import_logs` |

