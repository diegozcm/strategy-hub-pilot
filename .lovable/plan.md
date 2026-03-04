

## Plano: "Vínculo de Empresa" — Membro vs Consultor no ManageCompanyUsersModal

### Conceito e Nomenclatura

O recurso se chamará **"Tipo de Vínculo"** (ou `relation_type` no código). Cada usuário vinculado a uma empresa tem um **Tipo de Vínculo**:
- **Membro** — faz parte da empresa, aparece nos selects de responsável
- **Consultor** — acessa dados mas não aparece como responsável em KRs, projetos, etc.

### O que mudar no layout

Atualmente o badge "Membro" já existe e é clicável para alternar, mas não é visualmente claro. O plano:

1. **Substituir o badge clicável por um Select/Dropdown inline** ao lado de cada usuário na lista de membros (coluna direita). Opções: "Membro" / "Consultor". Isso torna a ação explícita e profissional.

2. **Estilização visual distinta**: Consultores terão badge âmbar/dourado, Membros terão badge padrão (azul/primário). O dropdown mostra o estado atual e permite troca com um clique.

3. **Tooltip explicativo**: Ao passar o mouse no dropdown, exibir: "Membros aparecem nos filtros e selects de responsável. Consultores apenas visualizam dados."

### Mudanças técnicas

**Arquivo**: `src/components/admin-v2/pages/companies/modals/ManageCompanyUsersModal.tsx`

- Substituir o `<Badge onClick={...}>` atual (linhas ~355-365) por um `<Select>` do Radix com duas opções
- Manter a função `handleToggleRelationType` existente, adaptando para receber o novo valor diretamente do select
- Adicionar tooltip no select com a explicação

Nenhuma mudança de banco de dados necessária — a coluna `relation_type` e a lógica já existem.

### Nome para referência futura

Use **"Tipo de Vínculo"** na interface e nas conversas. No código: `relation_type` (já existente).

