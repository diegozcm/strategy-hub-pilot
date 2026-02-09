
# Diagnóstico e Plano: Configuração de Validade da Senha Temporária

## Diagnóstico Atual

### Como funciona hoje

A expiração da senha temporária esta hardcoded na edge function `reset-user-password/index.ts` (linha 148):

```typescript
expirationTime.setMinutes(expirationTime.getMinutes() + 15); // 15 minutes validity
```

Esse valor de **15 minutos** e armazenado no campo `temp_reset_expires` da tabela `profiles`. Porem, existe uma desconexao importante:

| Aspecto | Situacao |
|---------|----------|
| Campo `temp_reset_expires` | Usado apenas para exibir validade do token na UI do admin |
| Login do usuario | **Nao verifica** `temp_reset_expires` - a senha funciona indefinidamente no Supabase Auth |
| Campo `must_change_password` | Nunca expira - permanece `true` ate o usuario trocar a senha |
| Senha no Supabase Auth | Uma vez definida via `admin.updateUserById`, nao tem expiracao nativa |

### O real problema

A "expiracao" que voce observa **nao e da senha em si** - a senha definida no Supabase Auth nunca expira. O que pode estar ocorrendo:

1. O campo `temp_reset_expires` (15 min) pode estar sendo verificado em algum fluxo da UI, bloqueando a visualizacao da senha pelo admin
2. Ou o token de reset do Supabase (diferente da senha direta) pode expirar

Na pratica, a senha temporaria definida via `admin.updateUserById` **continua funcionando** mesmo apos os 15 minutos. O campo `temp_reset_expires` e apenas informativo para o painel admin.

### Resumo do diagnostico

```text
Fluxo atual:
  Admin cria usuario
    -> Edge function gera senha temporaria
    -> Senha definida no Supabase Auth (sem expiracao)
    -> temp_reset_expires = agora + 15min (so informativo)
    -> must_change_password = true (sem expiracao)
    -> Email enviado com a senha

  Usuario tenta login dias depois:
    -> Senha FUNCIONA no Supabase Auth
    -> must_change_password = true -> modal de troca aparece
    -> Mas o admin VE "expirado" no painel (15min passaram)
```

---

## Solucao Proposta

### 1. Nova tabela: `password_policies` (configuracoes do sistema)

Criar uma tabela para armazenar configuracoes de politica de senha por empresa ou global:

```sql
CREATE TABLE password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  temp_password_validity_hours INTEGER NOT NULL DEFAULT 168, -- 7 dias padrao
  require_password_change BOOLEAN NOT NULL DEFAULT true,
  min_password_length INTEGER NOT NULL DEFAULT 8,
  require_uppercase BOOLEAN NOT NULL DEFAULT true,
  require_lowercase BOOLEAN NOT NULL DEFAULT true,
  require_number BOOLEAN NOT NULL DEFAULT true,
  require_special_char BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id) -- uma politica por empresa, NULL = global
);

-- Politica padrao global
INSERT INTO password_policies (company_id, temp_password_validity_hours)
VALUES (NULL, 168); -- 7 dias

-- RLS
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can manage password policies"
  ON password_policies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can read password policies"
  ON password_policies FOR SELECT
  USING (auth.role() = 'authenticated');
```

### 2. Atualizar Edge Function `reset-user-password`

Substituir o hardcoded de 15 minutos por consulta a tabela `password_policies`:

```typescript
// Buscar politica de senha (empresa do usuario ou global)
const { data: policy } = await supabaseAdmin
  .from('password_policies')
  .select('temp_password_validity_hours')
  .or(`company_id.eq.${userCompanyId},company_id.is.null`)
  .order('company_id', { ascending: false, nullsFirst: false })
  .limit(1)
  .single();

const validityHours = policy?.temp_password_validity_hours ?? 168; // fallback 7 dias

if (validityHours === 0) {
  // Sem expiracao
  profileUpdate.temp_reset_expires = null;
} else {
  const expirationTime = new Date();
  expirationTime.setHours(expirationTime.getHours() + validityHours);
  profileUpdate.temp_reset_expires = expirationTime.toISOString();
}
```

### 3. Atualizar Edge Function `send-user-credentials`

Mesma logica: consultar `password_policies` para definir `temp_reset_expires` ao criar usuarios.

### 4. Implementar pagina `PasswordPoliciesPage` no admin-v2

Substituir o placeholder atual em `src/components/admin-v2/pages/settings/PasswordPoliciesPage.tsx`:

**Interface proposta:**

```text
+---------------------------------------------------+
|  Politicas de Senha                                |
|  Configuracoes > Seguranca                         |
+---------------------------------------------------+
|                                                     |
|  Validade da Senha Temporaria                       |
|  ┌─────────────────────────────────────────┐       |
|  │  (o) 1 dia (24 horas)                  │       |
|  │  ( ) 7 dias (recomendado)              │       |
|  │  ( ) 30 dias                           │       |
|  │  ( ) Sem expiracao                     │       |
|  └─────────────────────────────────────────┘       |
|                                                     |
|  Requisitos de Senha                                |
|  ┌─────────────────────────────────────────┐       |
|  │  Tamanho minimo: [8___] caracteres     │       |
|  │  [x] Exigir letra maiuscula            │       |
|  │  [x] Exigir letra minuscula            │       |
|  │  [x] Exigir numero                     │       |
|  │  [x] Exigir caractere especial         │       |
|  └─────────────────────────────────────────┘       |
|                                                     |
|  [x] Forcar troca de senha no primeiro login        |
|                                                     |
|  Nota: Alteracoes se aplicam apenas a novas         |
|  senhas temporarias. Usuarios ja criados            |
|  mantem a validade original.                        |
|                                                     |
|         [ Salvar Configuracoes ]                    |
+---------------------------------------------------+
```

**Componente principal:**
- RadioGroup para selecao de validade (1 dia / 7 dias / 30 dias / Sem expiracao)
- Checkboxes para requisitos de senha
- Input numerico para tamanho minimo
- Botao de salvar com toast de confirmacao
- Busca a politica existente no mount, cria se nao existir

### 5. Validacao de expiracao no login (opcional mas recomendado)

Adicionar verificacao no `useMultiTenant.tsx` para bloquear login com senha temporaria expirada:

```typescript
// Apos login bem-sucedido, verificar se senha temporaria expirou
if (profileData?.must_change_password && profileData?.temp_reset_expires) {
  const isExpired = new Date(profileData.temp_reset_expires) < new Date();
  if (isExpired) {
    await supabase.auth.signOut();
    toast.error('Sua senha temporaria expirou. Solicite uma nova ao administrador.');
    return;
  }
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| Migracao SQL | **Criar** | Tabela `password_policies` com dados padrao |
| `supabase/functions/reset-user-password/index.ts` | Modificar | Consultar `password_policies` para validade |
| `supabase/functions/send-user-credentials/index.ts` | Modificar | Consultar `password_policies` para validade |
| `src/components/admin-v2/pages/settings/PasswordPoliciesPage.tsx` | Reescrever | Interface completa de configuracao |
| `src/hooks/useMultiTenant.tsx` | Modificar | Validar expiracao no login |
| `src/components/ui/FirstLoginModal.tsx` | Modificar | Validar requisitos de senha conforme politica |

---

## Estrategia de Migracao para Usuarios Existentes

1. Usuarios com `must_change_password = true` e `temp_reset_expires` ja passado: **manter funcionando** - a expiracao so sera aplicada para novos resets
2. A nova politica se aplica apenas a **novas senhas temporarias** geradas apos a configuracao
3. Opcao no admin para "Resetar senha" de usuarios existentes ja utiliza a nova validade

---

## Impactos de Seguranca

| Aspecto | Impacto | Mitigacao |
|---------|---------|-----------|
| Senha sem expiracao | Maior janela de ataque | Aviso visual no admin, recomendacao de 7 dias |
| Validade longa (30 dias) | Senha temporaria fica valida por muito tempo | must_change_password garante troca no primeiro uso |
| Politica por empresa | Complexidade | Fallback para politica global se empresa nao tiver |
| Requisitos de senha configuraveis | Senhas fracas se relaxados | Minimos absolutos (6 chars, pelo menos 1 requisito) |

---

## Ordem de Implementacao

1. Criar tabela `password_policies` (migracao SQL)
2. Implementar pagina `PasswordPoliciesPage` no admin-v2
3. Atualizar edge functions para consultar a politica
4. Adicionar validacao de expiracao no login
5. Atualizar `FirstLoginModal` para usar requisitos dinamicos
