
# Ajustes no Modulo de Mentorias do Startup HUB

## Resumo
Tres ajustes principais: (1) permitir que mentores vejam sessoes de outros mentores com foto e nome, (2) corrigir bug de data que registra no dia anterior, (3) atualizar as tres visualizacoes (lista, calendario, to do).

---

## 1. Visibilidade entre mentores (RLS + Dados)

### Problema atual
A policy RLS `Mentors can view their sessions` so permite ver sessoes onde `mentor_id = auth.uid()`. Mentores nao veem sessoes de outros mentores.

### Solucao

**1a. Nova policy RLS** - Criar policy que permite mentores verem sessoes de startups onde ambos sao mentores atribuidos:

```text
CREATE POLICY "Mentors can view sessions of shared startups"
ON public.mentoring_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mentor_startup_relations msr1
    JOIN mentor_startup_relations msr2 ON msr1.startup_company_id = msr2.startup_company_id
    WHERE msr1.mentor_id = auth.uid()
    AND msr2.mentor_id = mentoring_sessions.mentor_id
    AND msr1.status = 'active'
    AND msr2.status = 'active'
  )
);
```

Isso garante que um mentor so ve sessoes de outros mentores que estao atribuidos as mesmas startups.

**1b. Alterar `useMentorSessions` hook** - Remover o filtro `.eq('mentor_id', user.id)` e buscar todas as sessoes visiveis (RLS cuida da seguranca). Incluir join com `profiles` para pegar `first_name`, `last_name`, e `avatar_url` do mentor.

### Arquivos alterados
- Migration SQL (nova policy RLS)
- `src/hooks/useMentorSessions.tsx` - remover filtro mentor_id, adicionar dados do mentor

---

## 2. Correcao do bug de data

### Problema
Ao criar uma sessao clicando no dia 05, o sistema registra no dia 04. O problema esta em dois pontos:

- No `createSession`, a data `yyyy-MM-dd` e enviada diretamente ao Supabase. O banco interpreta como UTC, e dependendo do fuso, converte para o dia anterior.
- No `handleCreateSession` do `MentorCalendarPage`, usa `format(date, 'yyyy-MM-dd')` que pode ser afetado pelo fuso.

### Solucao
No `createSession` do hook `useMentorSessions.tsx`, converter a data da mesma forma que ja e feito no `updateSession`:

```typescript
session_date: new Date(sessionData.session_date + 'T12:00:00').toISOString()
```

Usar `T12:00:00` (meio-dia) em vez de `T00:00:00` para evitar que qualquer fuso horario empurre para o dia anterior.

### Arquivos alterados
- `src/hooks/useMentorSessions.tsx` - createSession e updateSession

---

## 3. Exibir foto e nome do mentor nas visualizacoes

### 3a. Vista Lista (`MentorSessionsPage.tsx`)
- Adicionar avatar e nome do mentor em cada card de sessao
- Usar componente Avatar com fallback de iniciais
- Diferenciar visualmente sessoes proprias vs de outros mentores

### 3b. Vista Calendario (`CalendarGrid.tsx`)
- Nos chips de sessao dentro do calendario, mostrar nome do mentor junto ao nome da startup
- No modal de detalhe da sessao, exibir avatar + nome do mentor

### 3c. Vista To Do (`MentorTodosList.tsx`)
- Sem alteracoes necessarias (todos sao pessoais do mentor)

### Arquivos alterados
- `src/hooks/useMentorSessions.tsx` - tipo MentoringSession com campos `mentor_name` e `mentor_avatar_url`
- `src/components/startup-hub/mentor/MentorSessionsPage.tsx` - exibir info do mentor
- `src/components/startup-hub/calendar/CalendarGrid.tsx` - exibir info do mentor nos chips e modais
- `src/components/startup-hub/calendar/MentorCalendarPage.tsx` - passar dados do mentor
- `src/components/startup-hub/calendar/SessionsStatsCard.tsx` - possivel ajuste de tipo

---

## Detalhes Tecnicos

### Hook `useMentorSessions.tsx` - Alteracoes principais

1. **Remover filtro `.eq('mentor_id', user.id)`** na query de fetchSessions
2. **Adicionar join com profiles**: buscar `first_name`, `last_name`, `avatar_url` via mentor_id
3. **Adicionar campos ao tipo**: `mentor_name`, `mentor_avatar_url`, `is_own_session`
4. **Corrigir data no createSession**: `session_date: new Date(sessionData.session_date + 'T12:00:00').toISOString()`
5. **Corrigir data no updateSession**: trocar `T00:00:00` por `T12:00:00`

### Tipo MentoringSession atualizado
```typescript
export interface MentoringSession {
  // ... campos existentes
  mentor_name?: string;
  mentor_avatar_url?: string;
  is_own_session?: boolean;
}
```

### Componentes visuais
- Usar `Avatar` + `AvatarImage` + `AvatarFallback` (ja existem no projeto)
- Mostrar badge "Sua sessao" vs nome do outro mentor
- Manter botoes de edicao/exclusao apenas para sessoes proprias (`is_own_session`)
