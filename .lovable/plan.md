

# Plano: Correcao de data + Melhorias visuais na Governanca

## Bug: Data nao e passada ao formulario

**Causa raiz**: Em `GovernanceMeetingsSection.tsx`, tanto o botao "Nova Reuniao" (linha 81) quanto "Agendar para este dia" (linha 153) abrem o dialog sem passar `initialData` com a data selecionada para o `GovernanceMeetingForm`. O form entao usa `format(new Date(), 'yyyy-MM-dd')` como fallback (sempre hoje).

**Correcao**: Passar `initialData={{ scheduled_date: format(selectedDate, 'yyyy-MM-dd') }}` ao `GovernanceMeetingForm` no dialog de criacao.

---

## Melhorias visuais

### 1. Formulario de agendamento (GovernanceMeetingForm)
- Botao "Salvar" com `variant="cofound"` em vez do default escuro
- Labels com `font-display` para consistencia
- Inputs com foco em `ring-cofound-blue-light`

### 2. Cards de reuniao do dia (GovernanceMeetingsSection)
- Aumentar padding e espaçamento interno
- Melhorar contraste do badge de status
- Tipo da reuniao com badge mais visivel (fundo colorido leve)
- Horario com icone de relogio

### 3. Modal de detalhes (MeetingDetailModal)
- Aumentar espaçamento entre campos de info
- Campos com fundo sutil (`bg-muted/30 rounded-lg p-3`) para melhor separacao visual
- Botoes de acao com mais destaque e espaçamento
- Badge de status maior e mais visivel no header

### 4. Regras de Governanca (GovernanceRulesSection)
- Textarea com placeholder mais descritivo
- Cards de regras com hover sutil
- Separador visual entre descricao geral e regras especificas

---

## Arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `GovernanceMeetingsSection.tsx` | Passar selectedDate ao form; melhorar cards do dia |
| `GovernanceMeetingForm.tsx` | Botao cofound, labels font-display |
| `MeetingDetailModal.tsx` | Campos info com fundo, botoes mais claros, espacamento |
| `GovernanceRulesSection.tsx` | Hover nos cards, espacamento |

