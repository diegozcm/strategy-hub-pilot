

## Corrigir Contabilizacao de Logins Inflada

### Problema Raiz

O evento `SIGNED_IN` do Supabase dispara **multiplas vezes** por sessao -- ao trocar de aba, ao atualizar token, ao reconectar. Cada disparo chama `logUserLogin`, inserindo um novo registro. Resultado: **2.508 registros de login** para apenas **27 usuarios** em 7 dias. Um unico usuario (voce) gerou centenas de registros em um dia.

Isso infla todos os numeros: Total de Sessoes, Logins/Usuario, e os graficos ficam completamente distorcidos.

### Causa Tecnica

Em `useMultiTenant.tsx`, linha 727:
```
if (event === 'SIGNED_IN' && session) {
  loadUserProfileOptimized(session.user.id, true); // SEMPRE loga
}
```

O Supabase emite `SIGNED_IN` nao apenas no login real, mas tambem em refreshes de token e reconexoes. Isso causa multiplos inserts por visita.

Alem disso, a query de analytics usa `supabase.from("user_login_logs").select(...)` sem `.limit()`, mas o Supabase tem limite padrao de **1000 linhas** -- entao os numeros sao cortados e inconsistentes.

---

### Solucao: Deduplicacao + Sessoes Reais

**1. Prevenir logs duplicados no frontend (`useMultiTenant.tsx`)**

Adicionar um guard que verifica se ja existe um login recente (ultimos 5 minutos) para o mesmo usuario antes de inserir um novo:

```typescript
const logUserLogin = async (userId: string, companyId: string | null) => {
  try {
    // Verificar se ja existe login nos ultimos 5 minutos
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('user_login_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('login_time', fiveMinAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      console.log('⏭️ Login already logged recently, skipping');
      return;
    }

    await supabase.from('user_login_logs').insert({...});
  } catch (error) { ... }
};
```

**2. Limpar dados historicos inflados (SQL migration)**

Criar uma limpeza que mantem apenas o **primeiro login de cada sessao real** (agrupando por usuario + janela de 5 minutos):

```sql
-- Deletar registros duplicados, mantendo o primeiro de cada janela de 5min
DELETE FROM user_login_logs
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, date_trunc('hour', login_time) + 
    INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM login_time) / 5))
    id
  FROM user_login_logs
  ORDER BY user_id, date_trunc('hour', login_time) + 
    INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM login_time) / 5), login_time ASC
);
```

**3. Corrigir queries de analytics para usar contagem no banco (`useAnalyticsStats.ts`)**

As queries atuais puxam TODOS os registros para o frontend e contam no JavaScript. Isso:
- Bate no limite de 1000 linhas do Supabase
- E lento com muitos dados

Solucao: usar RPCs ou `.select('*', { count: 'exact', head: true })` quando possivel, e adicionar `.limit()` explicito quando precisar dos dados.

**4. Adicionar variavel de controle por sessao de navegador**

Usar `sessionStorage` para marcar que o login ja foi registrado nesta sessao do navegador, evitando qualquer duplicata:

```typescript
const SESSION_KEY = 'login_logged';
if (sessionStorage.getItem(SESSION_KEY)) return;
// ... insert login
sessionStorage.setItem(SESSION_KEY, 'true');
```

---

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useMultiTenant.tsx` | Adicionar deduplicacao com `sessionStorage` + verificacao de login recente antes do insert |
| `src/hooks/admin/useAnalyticsStats.ts` | Corrigir queries para nao bater no limite de 1000 linhas |
| `src/hooks/admin/useDashboardStats.tsx` | Mesma correcao de limite nas queries de login stats |
| Migracao SQL | Limpeza dos registros duplicados historicos |

### Resultado Esperado

- Cada visita real do usuario gera **exatamente 1 registro** de login
- Numeros de "Total de Sessoes" e "Logins/Usuario" refletem a realidade
- Graficos mostram dados consistentes
- Dados historicos limpos

