
# Barras de Progresso nos Cards e Modal de Projetos

## Resumo
Adicionar barras de progresso visuais em dois locais:
1. **Card do Projeto** -- barra simples mostrando % de tasks concluidas, na cor do pilar
2. **Modal do Projeto** -- barra segmentada multi-status (concluido, em andamento, em revisao, a fazer) com tooltip ao passar o mouse

---

## 1. Card do Projeto (ProjectCard.tsx)

Adicionar uma barra de progresso entre o nome/pilar tag e o footer, mostrando a porcentagem de tasks concluidas:

- Barra fina (h-1.5 ou h-2) com fundo `muted`
- Preenchimento usando a cor do pilar (`pillarColor`)
- Texto pequeno ao lado mostrando "X%" (ex: "33%")
- Se nao houver tasks, nao exibir a barra

A interface `ProjectCardProps` ja recebe `taskCount` e `completedTasks`, entao basta calcular `percentage = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0`.

---

## 2. Modal do Projeto (ProjectsPage.tsx)

Abaixo da secao de imagem/header (linha ~1495), antes do conteudo scrollavel, inserir uma barra de progresso segmentada com 100% da largura interna:

- Barra dividida em 4 segmentos coloridos proporcionais:
  - **Concluido** (done) -- verde (`#10b981`)
  - **Em Revisao** (review) -- azul (`#3b82f6`)
  - **Em Andamento** (in_progress) -- amarelo (`#f59e0b`)
  - **A Fazer** (todo) -- cinza (`#94a3b8`)
- Cada segmento tem largura proporcional a quantidade de tasks naquele status
- Tooltip (usando Radix Tooltip ou title nativo) ao passar o mouse mostrando: "Concluido: X (Y%) | Em Andamento: Z (W%) | ..."
- Se nao houver tasks, exibir barra cinza com texto "Sem tarefas"

---

## Detalhes Tecnicos

### Arquivos a editar:

**`src/components/projects/ProjectCard.tsx`**
- Calcular `percentage` a partir de `taskCount` e `completedTasks`
- Adicionar `div` com barra de progresso antes do footer, usando cor do pilar via `style={{ backgroundColor: pillarColor }}`

**`src/components/projects/ProjectsPage.tsx`**
- Na secao do modal (apos linha ~1495), calcular contagem por status das tasks do projeto usando `projectTasks`
- Renderizar barra segmentada com `div` flex, cada segmento com `width` em percentual
- Usar `Tooltip` do Radix (ja disponivel no projeto) para mostrar detalhes ao hover
- Legendas pequenas abaixo da barra com bolinhas coloridas

### Calculo dos segmentos (modal):
```text
projectTasks = getProjectTasks(projectId)
done = tasks com status 'done'
review = tasks com status 'review'  
in_progress = tasks com status 'in_progress'
todo = tasks com status 'todo'
total = projectTasks.length

Cada segmento: width = (count / total) * 100 + '%'
```

### Nenhuma dependencia nova necessaria
- Usa componentes Radix Tooltip ja instalados
- Usa Tailwind para estilizacao
