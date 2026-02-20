

## Melhorar Exportacao e Criar Importacao de Dados de Empresa

### Problema Atual

A exportacao atual tem duas limitacoes importantes:

**1. Tabelas faltando na exportacao (10 tabelas):**
- `mentor_todos` - tarefas de mentoria (tem `startup_company_id`)
- `ai_analytics` - analytics de IA (via user_id dos membros)
- `ai_user_preferences` - preferencias de IA dos usuarios (via user_id)
- `startup_hub_profiles` - perfis do hub de startups (via user_id)
- `user_module_profiles` - perfis de modulos (via user_id)
- `user_module_roles` - roles de modulos (via user_id)
- `user_modules` - modulos dos usuarios (via user_id)
- `user_roles` - roles dos usuarios (via user_id)
- `profile_access_logs` - logs de acesso a perfis (via user_id)
- `vision_alignment_removed_dupes` - duplicatas removidas (tem `company_id`)

**2. Limite de 1000 registros por query do Supabase**
Tabelas com muitos registros (ex: `ai_chat_messages`, `key_result_values`) podem perder dados silenciosamente.

**3. Nao existe funcao de importacao**
O objetivo final e poder exportar dados de uma empresa e importa-los em outra.

---

### Solucao

#### Fase 1 - Corrigir a Exportacao (agora)

**Edge Function `export-company-data`:**

1. Adicionar as 10 tabelas faltantes ao export
2. Implementar paginacao automatica para superar o limite de 1000 registros (loop com `.range()` ate trazer todos os dados)
3. Incluir metadados de versao no JSON exportado para compatibilidade futura com importacao

O JSON exportado tera este formato:

```text
{
  "version": "1.0",
  "company_name": "...",
  "exported_at": "...",
  "source_company_id": "...",
  "total_records": 1234,
  "tables_exported": [...],
  "data": {
    "companies": [...],
    "strategic_plans": [...],
    ...todas as tabelas...
  }
}
```

#### Fase 2 - Funcao de Importacao (futuro)

A importacao sera uma nova Edge Function (`import-company-data`) que:
- Recebe o JSON exportado + o `target_company_id`
- Remapeia todos os UUIDs (gera novos IDs mantendo as relacoes entre tabelas)
- Remapeia `company_id` para a empresa destino
- Insere os dados respeitando a ordem de dependencia (empresas primeiro, depois planos, depois pilares, etc.)

**Esta fase nao sera implementada agora** - o foco e garantir que a exportacao esteja 100% completa para viabilizar a importacao futura.

---

### Detalhes Tecnicos

**Arquivo modificado:** `supabase/functions/export-company-data/index.ts`

Mudancas:
1. Nova funcao `fetchAllRows(tableName, query)` com paginacao automatica (busca em blocos de 1000 ate acabar)
2. Adicionar busca das 10 tabelas faltantes:
   - `mentor_todos` filtrado por `startup_company_id = company_id`
   - `vision_alignment_removed_dupes` filtrado por `company_id`
   - `ai_analytics`, `ai_user_preferences`, `startup_hub_profiles`, `user_module_profiles`, `user_module_roles`, `user_modules`, `user_roles`, `profile_access_logs` filtrados por `user_id IN (userIds dos membros da empresa)`
3. Adicionar campos `version` e `source_company_id` na resposta para compatibilidade futura

