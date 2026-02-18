
# Plano: Pagina Unica de Governanca RMRE com Modal de Reuniao

## Problema atual

As 4 sub-abas (Regras, Pautas, ATAs, Agenda) fragmentam a experiencia. O usuario precisa navegar entre abas para realizar tarefas que sao naturalmente conectadas (ex: ver reuniao na agenda, depois ir em Pautas selecionar a reuniao, depois ir em ATAs selecionar a mesma reuniao). Isso e confuso e redundante.

## Conceito: Tudo em uma pagina, detalhes no modal

A ideia central e: **a pagina mostra o calendario + regras de forma compacta. Ao clicar numa reuniao, abre um modal completo com tudo sobre aquela reuniao (editar, pautas, ATA).**

```text
+====================================================================+
| [icon] Governanca RMRE                          [+ Nova Reuniao]   |
| Proxima: RM Semanal - 25/02 as 14:00                              |
+====================================================================+
|                                                                     |
|  CALENDARIO (100% largura, celulas h-20, indicadores visuais)      |
|                                                                     |
|  [< ]        Fevereiro 2026                           [hoje] [>]   |
|  DOM    SEG    TER    QUA    QUI    SEX    SAB                     |
|  +------+------+------+------+------+------+------+               |
|  |      |      |      | *RM* |      |      |      |               |
|  |  1   |  2   |  3   |  4   |  5   |  6   |  7   |               |
|  +------+------+------+------+------+------+------+               |
|  | ...                                              |               |
|  +--------------------------------------------------+               |
|                                                                     |
|  --- Reunioes em 4 de fevereiro (1) ---                            |
|  +------------------------------------------------------------------+
|  | [RM] RM Semanal  14:00  Sala 1  [Agendada]  [Abrir detalhes >] |
|  +------------------------------------------------------------------+
|                                                                     |
+====================================================================+
| REGRAS DE GOVERNANCA (colapsavel)                                  |
| Descricao geral + lista de regras especificas                      |
+====================================================================+


=== AO CLICAR "Abrir detalhes" ou clicar na reuniao ===

+============================================+
|  MODAL: RM Semanal - 04/02/2026           |
|============================================|
|                                            |
|  [Dados]  [Pautas]  [ATA]                 |
|                                            |
|  --- ABA DADOS ---                         |
|  Tipo: RM  |  Horario: 14:00  |  60min    |
|  Local: Sala de reunioes                   |
|  Status: Agendada                          |
|  Notas: ...                                |
|  [Editar] [Concluir] [Cancelar] [Excluir] |
|                                            |
|  --- ABA PAUTAS ---                        |
|  1. Item de pauta X  [Pendente]  [editar]  |
|  2. Item de pauta Y  [Discutido] [editar]  |
|  [+ Adicionar item]                        |
|                                            |
|  --- ABA ATA ---                           |
|  Conteudo: ...                             |
|  Decisoes: ...                             |
|  Participantes: [Joao] [Maria]             |
|  [Salvar] [Aprovar]                        |
|                                            |
+============================================+
```

## Vantagens deste layout

1. **Zero fragmentacao** - O usuario ve tudo sobre uma reuniao em um unico modal, sem pular entre abas
2. **Pagina limpa** - So calendario + regras na pagina principal, nada saturado
3. **Contexto preservado** - Ao fechar o modal, o usuario volta exatamente para onde estava no calendario
4. **Fluxo natural** - Clicou na reuniao, ve detalhes, adiciona pauta, registra ATA, tudo no mesmo lugar

## Mudancas tecnicas

### 1. Eliminar GovernancaSubTabs

Remover o sistema de sub-abas. A pagina principal renderiza diretamente:
- Calendario (GovernanceMeetingsSection simplificado)
- Secao de Regras (GovernanceRulesSection, dentro de um Collapsible)

### 2. Novo componente: MeetingDetailModal

Modal grande (max-w-3xl) com mini-abas internas (Tabs do shadcn):

**Aba "Dados":**
- Informacoes da reuniao (tipo, data, horario, duracao, local, notas, status)
- Botoes: Editar (abre form inline ou toggle), Concluir, Cancelar, Excluir

**Aba "Pautas":**
- Lista de itens de pauta (reutiliza logica do AgendaItemsList atual)
- Adicionar/editar/remover itens de pauta diretamente
- Status por item (Pendente, Discutido, Adiado)

**Aba "ATA":**
- Formulario de conteudo, decisoes, participantes
- Se ja tem ATA: mostra conteudo com botao Editar e Aprovar
- Se nao tem: formulario para criar
- Status de aprovacao

### 3. Simplificar GovernanceMeetingsSection

Remover a tabela mensal separada (redundante com o calendario). Manter:
- Header com proxima reuniao e botao Nova Reuniao
- Calendario customizado (GovernanceCalendarGrid)
- Cards do dia selecionado - agora com botao "Abrir detalhes" que abre o modal
- Ou: clicar no card da reuniao ja abre o modal

### 4. Regras como secao colapsavel

Mover GovernanceRulesSection para baixo do calendario, dentro de um `Collapsible` do shadcn. Comeca colapsado para nao poluir. O usuario expande quando precisa ver/editar as regras.

### 5. Remover componentes obsoletos

- `GovernancaSubTabs.tsx` - substituido pela pagina unica
- `GovernanceAgendaSection.tsx` - logica movida para dentro do MeetingDetailModal
- `GovernanceAtasSection.tsx` - logica movida para dentro do MeetingDetailModal

## Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `GovernancaRMRETab.tsx` (GovernancaRMRETab) | Modificar - renderizar MeetingsSection + RulesSection diretamente |
| `GovernancaSubTabs.tsx` | Remover |
| `GovernanceMeetingsSection.tsx` | Modificar - simplificar, adicionar abertura do modal |
| `MeetingDetailModal.tsx` | Criar - modal com 3 abas (Dados, Pautas, ATA) |
| `MeetingCard.tsx` | Modificar - adicionar botao "Abrir detalhes" / click handler |
| `GovernanceRulesSection.tsx` | Modificar - envolver em Collapsible |
| `GovernanceAgendaSection.tsx` | Remover (logica vai para o modal) |
| `GovernanceAtasSection.tsx` | Remover (logica vai para o modal) |
