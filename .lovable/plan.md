
# Plano: Identidade Cofound + Funcionalidades de Edicao na Governanca RMRE

## Problemas identificados

1. **Visual generico** - Os componentes usam apenas cores padroes do shadcn (primary, muted, etc.) sem nenhuma referencia as cores Cofound (cofound-blue-light, cofound-green, cofound-blue-dark)
2. **Titulos sem fonte Cofound** - Titulos usam fonte padrão em vez de `font-display` (Saira)
3. **Botoes sem variante brand/cofound** - Todos os botoes usam variantes genericas (default, outline, ghost)
4. **Reunioes nao editaveis** - O hook `updateMeeting` existe mas nao e exposto no MeetingCard nem no MeetingsSection. Nao ha botao de "Editar" reuniao
5. **Cards sem personalidade** - Sem bordas coloridas, icones com cores Cofound, ou destaque visual
6. **Sub-abas genericas** - TabsList sem estilo Cofound (aba ativa deveria usar #CDD966 fundo com #10283F texto)

---

## Mudancas planejadas

### 1. Sub-abas com estilo Cofound

Aplicar no `GovernancaSubTabs.tsx`:
- TabsTrigger ativa com fundo `bg-[#CDD966]` e texto `text-[#10283F]`
- Icones nas abas (BookOpen, ClipboardList, FileText, CalendarDays)

### 2. Header principal com identidade

No `GovernancaRMRETab.tsx`:
- Titulo com `font-display` (Saira)
- Icone com cor `text-cofound-blue-light`
- Subtitulo com estilo Cofound

### 3. Agenda (GovernanceMeetingsSection)

- Header: icone com `text-cofound-blue-light`, botao "Nova Reuniao" com `variant="brand"`
- Badge "proximo reuniao" com fundo `bg-cofound-blue-light/10`
- Botao "Agendar para este dia" com `variant="brand"`
- **Adicionar botao "Editar"** no MeetingCard que abre dialog com GovernanceMeetingForm pre-preenchido

### 4. Calendario (GovernanceCalendarGrid)

- Header do mes com `font-display`
- Dia de hoje com `bg-cofound-blue-light` em vez de `bg-primary`
- Dia selecionado com `ring-cofound-blue-light`
- Dots de tipo de reuniao mantidos (azul/verde/laranja)

### 5. MeetingCard com edicao e estilo Cofound

- Borda esquerda colorida por tipo (RM azul, RE verde, Extraordinaria amber)
- **Botao "Editar" novo** que abre dialog com form pre-preenchido
- Badges de status com cores mais Cofound
- Botoes "Concluir" com `variant="cofound"`

### 6. Regras (GovernanceRulesSection)

- Titulos com `font-display`
- Icone BookOpen com `text-cofound-blue-light`
- Botao "Adicionar" com `variant="brand"`
- Itens da lista com borda esquerda `border-l-2 border-cofound-green`

### 7. Pautas (GovernanceAgendaSection)

- Titulos com `font-display`
- Botao "Adicionar" com `variant="brand"`
- Badges de status com cores Cofound

### 8. ATAs (GovernanceAtasSection)

- Titulos com `font-display`
- Botao "Nova ATA" com `variant="brand"`
- Badge "Aprovada" com `bg-cofound-green text-cofound-blue-dark`

---

## Detalhe tecnico: Edicao de reunioes

O hook `updateMeeting` ja existe. O que falta e:
- No `GovernanceMeetingsSection`: passar `updateMeeting` para o `MeetingCard`
- No `MeetingCard`: adicionar botao "Editar" que abre um `Dialog` com `GovernanceMeetingForm` usando `initialData` pre-preenchido
- O `GovernanceMeetingForm` ja aceita `initialData` como prop

---

## Resumo de arquivos

| Arquivo | Mudanca |
|---|---|
| `GovernancaRMRETab.tsx` | Font-display no titulo, icone Cofound |
| `GovernancaSubTabs.tsx` | Icones nas abas, estilo ativo Cofound (#CDD966) |
| `GovernanceMeetingsSection.tsx` | Cores Cofound, passar updateMeeting ao MeetingCard |
| `GovernanceCalendarGrid.tsx` | Cores Cofound no hoje/selecionado, font-display |
| `MeetingCard.tsx` | Borda colorida por tipo, botao Editar com dialog, estilo Cofound |
| `GovernanceRulesSection.tsx` | Font-display, cores Cofound, borda verde nos itens |
| `GovernanceAgendaSection.tsx` | Font-display, cores Cofound nos botoes e badges |
| `GovernanceAtasSection.tsx` | Font-display, cores Cofound, badge aprovada verde |
