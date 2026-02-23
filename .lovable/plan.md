
## Tres Correcoes: Confirmacao de KR, Delete de Objetivo, e Exclusao Cascata de Pilar

### Problema 1: Botao "Apagar" KR sem confirmacao
No `KROverviewModal.tsx`, o botao "Apagar" (linha 482) chama `onDelete` diretamente sem nenhuma etapa de confirmacao. Um clique acidental apaga o KR permanentemente.

**Solucao:** Adicionar um `AlertDialog` de confirmacao dentro do `KROverviewModal`. O botao "Apagar" passa a abrir o dialog em vez de chamar `onDelete` diretamente.

**Arquivo:** `src/components/strategic-map/KROverviewModal.tsx`
- Adicionar estado `showDeleteConfirm`
- Trocar `onClick={onDelete}` por `onClick={() => setShowDeleteConfirm(true)}`
- Adicionar AlertDialog com titulo "Confirmar Exclusao", nome do KR, e botoes Cancelar/Excluir

---

### Problema 2: Nao consegue apagar objetivo de novo
O `ObjectiveDetailModal` tem um `handleDeleteConfirm` que chama `onDelete()`. Se `onDelete` lanca uma excecao (ex: FK constraint porque os KRs ainda existem no banco), o `catch` captura o erro silenciosamente e o modal fecha (`onClose()` na linha 163). Mas o problema principal e que a funcao `handleDeleteObjective` no `ObjectiveCard.tsx` (e no `RumoObjectiveBlock.tsx`) tenta deletar o objetivo sem deletar os KRs filhos primeiro — e o banco tem FK constraint.

**Solucao:** Nos handlers `handleDeleteObjective` (em `ObjectiveCard.tsx` e `RumoObjectiveBlock.tsx`), antes de deletar o objetivo, deletar todos os KRs associados. Tambem melhorar o tratamento de erro no `ObjectiveDetailModal` para mostrar toast de erro ao usuario.

**Arquivos:**
- `src/components/strategic-map/ObjectiveCard.tsx` — no `handleDeleteObjective`, adicionar delete cascata de KRs antes do objetivo
- `src/components/dashboard/RumoObjectiveBlock.tsx` — mesma correcao
- `src/components/objectives/ObjectivesPage.tsx` — verificar e corrigir o mesmo padrao (se aplicavel)

---

### Problema 3: Excluir pilar inteiro com objetivos e KRs (com confirmacao por nome)
Atualmente o `DeletePillarModal` **bloqueia** a exclusao se o pilar tem objetivos. O usuario quer poder excluir um pilar inteiro (com todos os objetivos e KRs), mas com uma etapa extra de confirmacao: digitar o nome do pilar.

**Solucao:**
1. **Alterar `DeletePillarModal.tsx`**: Remover o bloqueio quando ha objetivos. Em vez disso, quando o pilar tem objetivos/KRs, exibir um aviso claro e exigir que o usuario digite o nome do pilar para confirmar. O botao de exclusao so fica habilitado quando o nome digitado coincide.

2. **Alterar `useStrategicMap.tsx` (`deletePillar`)**: Remover a verificacao que bloqueia exclusao de pilar com objetivos. Implementar exclusao cascata:
   - Buscar todos os KRs dos objetivos do pilar
   - Deletar KRs (e dados relacionados como `kr_fca_entries`, `kr_status_reports`, `kr_initiatives`)
   - Deletar objetivos
   - Deletar pilar

**Arquivos:**
- `src/components/strategic-map/DeletePillarModal.tsx` — redesenhar modal com input de confirmacao por nome
- `src/hooks/useStrategicMap.tsx` — alterar `deletePillar` para exclusao cascata

---

### Detalhes Tecnicos

**KROverviewModal — confirmacao de delete:**
```
// Novo estado
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// Botao muda de onClick={onDelete} para:
onClick={() => setShowDeleteConfirm(true)}

// AlertDialog adicionado ao final do componente
```

**DeletePillarModal — input de confirmacao:**
```
// Novo estado
const [confirmName, setConfirmName] = useState('');
const isNameMatch = confirmName.trim().toLowerCase() === pillar.name.trim().toLowerCase();

// Input de texto para digitar o nome
// Botao de exclusao habilitado apenas quando isNameMatch === true
// Aviso listando quantidade de objetivos e KRs que serao excluidos
```

**deletePillar cascata (useStrategicMap.tsx):**
```
// 1. Buscar objetivos do pilar
// 2. Buscar KR IDs dos objetivos
// 3. Deletar kr_fca_entries, kr_status_reports, kr_initiatives dos KRs
// 4. Deletar key_results
// 5. Deletar strategic_objectives
// 6. Deletar strategic_pillars
```

**handleDeleteObjective cascata:**
```
// 1. Deletar KRs do objetivo primeiro
// 2. Depois deletar o objetivo
```
