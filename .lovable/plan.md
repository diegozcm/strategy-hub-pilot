

# Plano: Redesign completo da Agenda de Reunioes

## Feedback sobre o layout atual

1. **Calendario pequeno demais** - As celulas sao compactas e nao aproveitam os 85% de largura disponivel. O calendario parece "perdido" dentro do card.
2. **Sidebar sem utilidade** - Com 0 reunioes, a sidebar so mostra "Sem reunioes neste mes" e desperdiça espaço. Mesmo com reunioes, a informacao e redundante.
3. **Sem indicadores visuais** - Dias com reunioes nao tem dots, badges ou cores diferenciadas. O usuario precisa clicar dia a dia para descobrir se tem algo.
4. **Area de detalhes pobre** - A mensagem "Nenhuma reuniao em 20 de fevereiro" nao oferece acao. Deveria convidar o usuario a criar uma reuniao.
5. **Sem contadores no header** - Falta contexto: quantas reunioes no mes, proxima reuniao, etc.
6. **Falta responsividade** - O layout side-by-side pode quebrar em telas menores.

---

## Novo layout proposto

```text
+------------------------------------------------------------------+
| [calendar icon] Agenda de Reunioes                                |
| Proxima: RM Semanal - 25/02 as 14:00          [+ Nova Reuniao]   |
+------------------------------------------------------------------+
|                                                                    |
| [< ]       Fevereiro 2026                              [hoje] [>] |
|                                                                    |
| DOM      SEG      TER      QUA      QUI      SEX      SAB        |
| +------+--------+--------+--------+--------+--------+--------+   |
| |      |        |        |        |        |        |        |   |
| |  1   |   2    |   3    |   4    |   5    |   6    |   7    |   |
| |      |        |        |  *RM*  |        |        |        |   |
| +------+--------+--------+--------+--------+--------+--------+   |
| |      |        |        |        |        |        |        |   |
| |  8   |   9    |  10    |  11    |  12    |  13    |  14    |   |
| |      |        |        |        |  *RE*  |        |        |   |
| +------+--------+--------+--------+--------+--------+--------+   |
| | ...                                                         |   |
| +-------------------------------------------------------------+   |
|                                                                    |
| --- Reunioes em 4 de fevereiro (1) ----------------------------- |
| +--------------------------------------------------------------+ |
| | [RM] RM Semanal           14:00 - 15:00     [Agendada]       | |
| | Local: Sala de reunioes   Resp: Joao Silva                    | |
| | Pautas: 3 itens                    [Concluir] [Cancelar] [x] | |
| +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| Reunioes do mes (4)                                               |
| +--------+------------------+-------+--------+---------+         |
| | 04/02  | RM Semanal       | 14:00 | Sala 1 | Agendada|         |
| | 12/02  | RE Mensal        | 09:00 | Online | Agendada|         |
| | 18/02  | RM Semanal       | 14:00 | Sala 1 | Concluida|        |
| | 25/02  | RM Semanal       | 14:00 | Sala 1 | Agendada|         |
| +--------+------------------+-------+--------+---------+         |
+------------------------------------------------------------------+
```

## Mudancas tecnicas

### 1. Eliminar sidebar - layout single-column

Remover o layout `flex` com sidebar de 15%. Usar layout de coluna unica com:
- Calendario ocupando 100% da largura
- Detalhes do dia selecionado logo abaixo do calendario
- Lista mensal de reunioes em tabela/cards abaixo

### 2. Calendario com celulas maiores e indicadores

- Celulas de altura fixa maior (h-16 ou h-20) com espaco para mostrar dots/labels
- Dias com reunioes mostram um dot colorido (azul para RM, verde para RE, laranja para extraordinaria)
- Hover mostra tooltip com resumo das reunioes do dia
- Dia selecionado com destaque mais forte

### 3. Header informativo

- Adicionar linha "Proxima reuniao: [titulo] - [data] as [hora]" abaixo do titulo
- Contador de reunioes do mes
- Botao "Hoje" para voltar ao dia atual rapidamente

### 4. Painel de detalhes do dia melhorado

- Quando tem reunioes: cards completos com tipo, horario, local, numero de pautas, acoes
- Quando vazio: mensagem com botao "Agendar reuniao para este dia" (pre-preenchendo a data)
- Transicao suave ao trocar de dia

### 5. Lista mensal compacta abaixo

- Tabela/grid com todas as reunioes do mes visivel
- Colunas: Data, Titulo, Horario, Local, Status
- Clicavel para selecionar o dia no calendario
- Badges coloridos por tipo (RM/RE/Extraordinaria) e status

### 6. Implementacao customizada do calendario

Como o componente `Calendar` do shadcn/react-day-picker e limitado para celulas customizadas com conteudo extra, sera necessario:
- Criar um componente `GovernanceCalendarGrid` customizado que renderiza o grid manualmente
- Cada celula e um div com o numero do dia + indicadores de reunioes
- Manter navegacao mes anterior/proximo com os mesmos controles
- Ou alternativamente, usar `components` prop do DayPicker para customizar o conteudo de cada dia

## Arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `src/components/tools/governance/GovernanceMeetingsSection.tsx` | Reescrever layout completo: remover sidebar, calendario expandido, painel de detalhes, lista mensal |
| `src/components/tools/governance/GovernanceCalendarGrid.tsx` | Novo - componente de calendario customizado com celulas grandes e indicadores |
| `src/components/tools/governance/MeetingCard.tsx` | Novo - extrair card de reuniao como componente reutilizavel com layout melhorado |

