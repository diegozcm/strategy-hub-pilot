

# Correcao da Politica RLS da Tabela Companies

## Problema
A politica de SELECT `Users can view companies` na tabela `companies` nao permite que system admins vejam empresas do tipo `startup` a menos que tenham uma relacao direta na tabela `user_company_relations`. Por isso a empresa Nexo (tipo startup) nao aparece para o Bernardo no painel admin.

## Solucao
Alterar a politica RLS de SELECT para adicionar `OR public.is_system_admin(auth.uid())`, permitindo que system admins vejam todas as empresas independentemente do tipo.

## Detalhes Tecnicos

### Politica atual (SELECT)
```text
auth.uid() IS NOT NULL
AND (
  company_type = 'regular'
  OR (
    company_type = 'startup'
    AND EXISTS (
      SELECT 1 FROM user_company_relations ucr
      WHERE ucr.company_id = companies.id AND ucr.user_id = auth.uid()
    )
  )
)
```

### Politica corrigida
```text
auth.uid() IS NOT NULL
AND (
  public.is_system_admin(auth.uid())
  OR company_type = 'regular'
  OR (
    company_type = 'startup'
    AND EXISTS (
      SELECT 1 FROM user_company_relations ucr
      WHERE ucr.company_id = companies.id AND ucr.user_id = auth.uid()
    )
  )
)
```

### Implementacao
Executar o seguinte SQL via migration:

```text
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

CREATE POLICY "Users can view companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_system_admin(auth.uid())
    OR company_type = 'regular'
    OR (
      company_type = 'startup'
      AND EXISTS (
        SELECT 1 FROM user_company_relations ucr
        WHERE ucr.company_id = companies.id AND ucr.user_id = auth.uid()
      )
    )
  )
);
```

### Arquivos alterados
1. Nova migration SQL para atualizar a politica RLS

