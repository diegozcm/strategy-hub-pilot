

## Redesign do Modal de Detalhes da Empresa

### Objetivo
Transformar o modal de detalhes da empresa de um layout vertical estreito com tabs empilhadas em um layout horizontal profissional e amplo, e fazer com que clicar na linha da tabela abra diretamente os detalhes (sem precisar do menu de 3 pontos).

### Alteracoes

**1. Clique direto na linha da tabela (5 arquivos)**

Remover o `DropdownMenu` com botao de 3 pontos e tornar toda a linha (`TableRow`) clicavel. Ao clicar, abre o modal de detalhes diretamente.

Arquivos afetados:
- `FilterCompaniesPage.tsx`
- `AllCompaniesPage.tsx`
- `ActiveCompaniesPage.tsx`
- `InactiveCompaniesPage.tsx`
- `ActiveStartupsPage.tsx` (ja abre pelo card, manter)

Em cada arquivo:
- Remover a coluna vazia do `TableHead` (a dos 3 pontos)
- Adicionar `className="cursor-pointer hover:bg-muted/50"` e `onClick={() => handleOpenDetails(company)}` no `TableRow`
- Remover todo o bloco `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`
- Limpar imports nao utilizados (`MoreHorizontal`, `DropdownMenu`, etc.)

**2. Redesign do CompanyDetailsModal (layout horizontal profissional)**

Transformar o modal atual (max-w-2xl, tabs verticais empilhadas) em um layout amplo e organizado:

- Aumentar o modal para `sm:max-w-4xl` (largura ampla)
- Substituir o layout de tabs empilhadas por um layout com **sidebar de navegacao a esquerda** e **conteudo a direita**
- A sidebar tera botoes de navegacao verticais (Informacoes, Usuarios, Configuracoes, Acoes) com icones
- O conteudo muda conforme o item selecionado na sidebar

Estrutura do novo layout:

```text
+------------------------------------------------------+
| [Logo] Nome da Empresa    [Ativa] [Regular] [AI]  [X]|
+------------------------------------------------------+
|            |                                          |
| Informacoes|  Conteudo da secao selecionada           |
| Usuarios   |  (grid de dados, listas, cards)          |
| Config     |                                          |
| Acoes      |                                          |
|            |                                          |
+------------------------------------------------------+
```

Detalhes do layout:
- Header horizontal com logo grande, nome, badges de status/tipo/AI e botao de fechar
- Corpo dividido em 2 colunas: sidebar estreita (180px) + area de conteudo
- Sidebar com botoes tipo menu vertical, highlight no item ativo
- Area de conteudo com scroll independente
- Manter todo o conteudo existente das tabs (informacoes, usuarios, config, acoes) reorganizado nesse novo formato
- O conteudo de cada secao permanece identico, apenas muda a navegacao

**3. Melhoria visual nas secoes**

- **Informacoes**: grid 2x2 com cards pequenos para cada metrica (tipo, data, usuarios, AI), seguido de missao/visao/valores
- **Usuarios**: lista com scroll, contagem no titulo da secao
- **Configuracoes**: cards de toggle mantidos
- **Acoes**: cards de acao mantidos (editar, gerenciar usuarios, status, exportar, importar)

### Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/components/admin-v2/pages/companies/modals/CompanyDetailsModal.tsx` | Redesign completo do layout para formato horizontal com sidebar |
| `src/components/admin-v2/pages/companies/FilterCompaniesPage.tsx` | Linha clicavel, remover dropdown de 3 pontos |
| `src/components/admin-v2/pages/companies/AllCompaniesPage.tsx` | Linha clicavel, remover dropdown de 3 pontos |
| `src/components/admin-v2/pages/companies/ActiveCompaniesPage.tsx` | Linha clicavel, remover dropdown de 3 pontos |
| `src/components/admin-v2/pages/companies/InactiveCompaniesPage.tsx` | Linha clicavel, remover dropdown de 3 pontos |

