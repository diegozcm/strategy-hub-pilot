

## Analise dos Dados de Analytics - Problemas Encontrados

### Diagnostico

Analisei os dados reais do banco e encontrei **3 problemas graves** que tornam as metricas atuais pouco confiaveis:

| Metrica | Problema | Dados Reais |
|---------|----------|-------------|
| **Total de Sessoes** | Inflado. Cada refresh de pagina cria um novo registro de login | 3.246 "sessoes" em 7 dias para apenas 26 usuarios |
| **Duracao Media** | Sempre mostra 0s. O campo `logout_time` nunca e preenchido | 0 de 3.246 registros tem `logout_time` |
| **Dispositivos** | Sempre vazio. O campo `user_agent` nunca e capturado no insert | 0 de 3.246 registros tem `user_agent` |
| **Sessoes/Usuario** | Valor distorcido (124.8) por causa da contagem inflada | Um usuario sozinho tem 1.126 "sessoes" |

### Causa Raiz

A funcao `logUserLogin()` e chamada tanto no evento `SIGNED_IN` quanto no `INITIAL_SESSION` do Supabase Auth. O `INITIAL_SESSION` dispara em **cada carregamento de pagina** quando o usuario ja esta logado, criando registros duplicados massivamente.

### Plano de Correcao

**1. Corrigir a contagem de sessoes (evitar duplicatas)**

No `useMultiTenant.tsx`, chamar `logUserLogin` apenas no evento `SIGNED_IN` (login real), e nao no `INITIAL_SESSION` (refresh de pagina). Isso resolve a inflacao de dados.

**2. Capturar o `user_agent` no insert**

Adicionar `navigator.userAgent` ao insert do login log:

```typescript
await supabase.from('user_login_logs').insert({
  user_id: userId,
  company_id: companyId,
  login_time: new Date().toISOString(),
  user_agent: navigator.userAgent,
});
```

**3. Corrigir a duracao media da sessao**

O `logUserLogout` ja existe e funciona corretamente, mas so e chamado no `SIGNED_OUT`. O problema e que muitos usuarios simplesmente fecham o navegador sem fazer logout. Solucao:

- Adicionar um listener de `beforeunload` no navegador para registrar logout ao fechar aba/janela
- Usar `visibilitychange` como fallback para detectar quando o usuario sai

**4. Renomear metricas para refletir a realidade**

- "Sessoes/Usuario" -> "Logins/Usuario" (mais preciso)
- Adicionar tooltip explicativo nas metricas

**5. Limpar dados historicos inflados**

Executar uma query para remover os registros duplicados de `INITIAL_SESSION`, mantendo apenas o primeiro login por usuario por dia. Isso corrige o historico.

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useMultiTenant.tsx` | Chamar `logUserLogin` apenas no `SIGNED_IN`; adicionar `user_agent`; adicionar listener de `beforeunload` para logout |
| `src/hooks/admin/useAnalyticsStats.ts` | Renomear campo `avgPagesPerVisit` para `avgLoginsPerUser` |
| `src/components/admin-v2/pages/dashboard/AnalyticsSection.tsx` | Atualizar labels e adicionar tooltips |

### Resultado esperado

- **Sessoes**: Numero real de logins (nao inflado por refreshes)
- **Duracao Media**: Valor real baseado em login/logout
- **Dispositivos**: Dados reais de user agent
- **Sessoes/Usuario**: Valor coerente (ex: 2-3 em vez de 124)

