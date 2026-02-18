

# Plano: Criar nova ferramenta "Governanca RMRE" na pagina de Ferramentas

## O que sera feito

Adicionar uma nova aba "Governanca RMRE" na pagina de Ferramentas (`/app/tools`), ao lado das abas existentes (Golden Circle, SWOT, Alinhamento de Visao). Por enquanto, a aba tera uma estrutura inicial com um placeholder de calendario que sera desenvolvido posteriormente.

## Mudancas tecnicas

### 1. Criar componente `GovernancaRMRETab.tsx`

Novo arquivo em `src/components/tools/GovernancaRMRETab.tsx` com:
- Titulo "Governanca RMRE" e descricao
- Um placeholder de calendario (Card vazio com icone de calendario e mensagem "Em breve") para ser desenvolvido depois
- Seguir o mesmo padrao visual dos outros tabs (Cards com header e content)

### 2. Atualizar `ToolsPage.tsx`

- Importar o novo componente `GovernancaRMRETab`
- Alterar o grid de `grid-cols-3` para `grid-cols-4` no TabsList
- Adicionar novo `TabsTrigger` com value `governance-rmre` e label "Governanca RMRE"
- Adicionar novo `TabsContent` renderizando o `GovernancaRMRETab`

### 3. Atualizar `index.ts`

- Exportar o novo componente `GovernancaRMRETab`

## Resumo dos arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/tools/GovernancaRMRETab.tsx` | Novo - componente da aba com placeholder de calendario |
| `src/components/tools/ToolsPage.tsx` | Adicionar 4a aba no TabsList e TabsContent |
| `src/components/tools/index.ts` | Exportar novo componente |

