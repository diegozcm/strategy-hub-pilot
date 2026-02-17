

# Plano: Filtrar responsaveis para mostrar apenas usuarios nativos da empresa

## Problema

Quando voce (COFOUND) acessa a pagina de uma empresa que supervisiona (ex: Empresa Modelo, Projuris), os selects de responsaveis mostram TODOS os usuarios que tem acesso aquela empresa, incluindo consultores/supervisores da COFOUND. Isso nao faz sentido, pois Bernardo, Deia, Leonardo etc. nao sao funcionarios da Empresa Modelo - sao supervisores.

A causa raiz esta na funcao RPC `get_company_users`, que retorna todos os usuarios da tabela `user_company_relations` sem distinguir se o usuario "pertence" de fato aquela empresa ou se apenas a supervisiona.

## Dados do problema

Cada usuario tem um campo `profiles.company_id` que indica sua empresa principal (a empresa onde ele realmente trabalha). Por exemplo:
- Bernardo Bruschi -> `profiles.company_id` = COFOUND
- User Test -> `profiles.company_id` = Empresa Modelo
- Diego Zagonel -> `profiles.company_id` = Nexo

Quando se consulta os usuarios da "Empresa Modelo", o sistema retorna 9 pessoas (incluindo Bernardo, Deia, Diego etc.), mas apenas "User Test" realmente pertence a essa empresa.

## Solucao

Filtrar a funcao `get_company_users` para retornar apenas usuarios cujo `profiles.company_id` corresponde a empresa consultada. Supervisores/consultores continuam tendo acesso ao sistema, mas nao aparecem como opcoes de responsavel.

## Mudancas tecnicas

### 1. Atualizar a funcao RPC `get_company_users` (migracao SQL)

Adicionar filtro `AND p.company_id = _company_id` na query:

```sql
CREATE OR REPLACE FUNCTION public.get_company_users(_company_id uuid)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.avatar_url
  FROM user_company_relations ucr
  JOIN profiles p ON p.user_id = ucr.user_id
  WHERE ucr.company_id = _company_id
    AND p.company_id = _company_id   -- NOVO: so usuarios nativos
    AND (
      user_belongs_to_company(auth.uid(), _company_id)
      OR is_system_admin(auth.uid())
    )
  ORDER BY p.first_name, p.last_name
$$;
```

### 2. Nenhuma mudanca no frontend necessaria

Como todos os componentes ja usam o hook `useCompanyUsers` que chama essa RPC, a correcao na funcao do banco corrige automaticamente todos os locais:

| Componente | O que usa | Sera corrigido |
|---|---|---|
| `IndicatorsPage.tsx` | Filtro de responsavel nos KRs | Sim (automatico) |
| `KRFiltersSheet.tsx` | Lista de responsaveis no filtro lateral | Sim (automatico) |
| `KREditModal.tsx` | Select "Dono do KR" | Sim (automatico) |
| `AddResultadoChaveModal.tsx` | Select "Dono do KR" ao criar | Sim (automatico) |
| `InlineKeyResultForm.tsx` | Select "Dono do KR" inline | Sim (automatico) |
| `StandaloneKeyResultForm.tsx` | Select "Dono do KR" standalone | Sim (automatico) |
| `ProjectsPage.tsx` | Select responsavel de projetos/tarefas | Sim (automatico) |

### 3. Locais com responsavel em texto livre (nao afetados, mas vale notar)

Alguns componentes usam campos de texto livre para o responsavel (nao um select de usuarios):
- `KRInitiativesModal.tsx` - campo "Responsavel" da iniciativa (Input de texto)
- `ActionFormModal.tsx` - campo "Responsavel" da acao (Input de texto)
- `FCAActionsTable.tsx` - campo "Quem" na acao do FCA (Input de texto)

Esses nao precisam de alteracao pois o usuario digita o nome manualmente.

## Resultado esperado

- Ao visualizar a COFOUND: mostra apenas Bernardo, Deia, Diego, Francine, Leonardo, Luana, etc. (quem tem `profiles.company_id = COFOUND`)
- Ao visualizar a Empresa Modelo: mostra apenas "User Test" (quem tem `profiles.company_id = Empresa Modelo`)
- Ao visualizar a Projuris: mostra apenas usuarios cujo `profiles.company_id = Projuris`
- Supervisores continuam podendo acessar e ver os dados, mas nao aparecem como opcao nos selects de responsavel

