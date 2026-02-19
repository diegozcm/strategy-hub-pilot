

## Editor Rico (WYSIWYG) para Release Notes

Substituir o editor Markdown atual por um editor visual rico estilo WordPress usando **Tiptap** -- um editor modular para React que permite formatar texto, inserir imagens arrastando, e ver o resultado final enquanto escreve, sem precisar conhecer Markdown.

---

### O que muda para voce (usuario)

- Em vez de escrever `## Titulo` e `![img](url)`, voce vera uma **barra de ferramentas** com botoes para Negrito, Italico, Titulos (H1-H3), Listas, etc.
- Para inserir uma imagem, basta **clicar no botao de imagem** e selecionar um arquivo, ou **arrastar e soltar** a imagem direto no editor -- ela aparece inline, como no Word/WordPress.
- O conteudo e editado visualmente -- o que voce ve e o que o usuario final vera.
- A aba "Preview" separada deixa de ser necessaria, pois o editor ja mostra o resultado formatado.

---

### Barra de Ferramentas do Editor

```text
[ H1 | H2 | H3 | B | I | --- | Lista | Lista Num. | Imagem | Desfazer | Refazer ]
```

Botoes planejados:
- **Titulos**: H1, H2, H3
- **Formatacao**: Negrito, Italico
- **Separador**: Linha horizontal
- **Listas**: Com marcadores e numeradas
- **Imagem**: Upload de arquivo local (salvo em `/public/releases/`)
- **Desfazer/Refazer**

---

### Estrategia de Armazenamento

- O editor Tiptap gera **HTML** internamente.
- O campo `content` no banco continuara sendo `text`, mas passara a armazenar HTML em vez de Markdown.
- A pagina publica (`/releases`) sera atualizada para renderizar HTML diretamente em vez de usar ReactMarkdown.
- O conteudo existente (v1.0.0 em Markdown) sera convertido para HTML via uma migracao SQL simples usando funcoes de replace.

---

### Detalhes Tecnicos

**Dependencia nova**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`

**Arquivos criados**:

| Arquivo | Descricao |
|---------|-----------|
| `src/components/admin-v2/components/releases/RichTextEditor.tsx` | Componente do editor Tiptap com toolbar e area de edicao |
| `src/components/admin-v2/components/releases/EditorToolbar.tsx` | Barra de ferramentas com botoes de formatacao |

**Arquivos modificados**:

| Arquivo | Alteracao |
|---------|-----------|
| `ReleaseNoteForm.tsx` | Substituir Textarea + Tabs (Escrever/Preview) pelo componente `RichTextEditor`. Remover import do `MarkdownPreview` |
| `MarkdownPreview.tsx` | Renomear para `ContentPreview.tsx` -- renderizar HTML com `dangerouslySetInnerHTML` (sanitizado com DOMPurify que ja esta instalado) em vez de ReactMarkdown |
| `ReleasesPage.tsx` (pagina publica) | Trocar `ReactMarkdown` por renderizacao HTML sanitizada |
| `EditReleasePage.tsx` | Sem mudancas estruturais, o `defaultValues.content` agora sera HTML |

**Fluxo de upload de imagem**:
1. Usuario clica no botao de imagem ou arrasta arquivo para o editor
2. O arquivo e enviado para o Supabase Storage (bucket `release-images`)
3. A URL publica retornada e inserida como tag `<img>` no editor
4. Alternativa simplificada: converter imagem para base64 inline (sem necessidade de storage, mas aumenta o tamanho do campo)

**Migracao do conteudo existente**:
- Uma migracao SQL convertera o Markdown da v1.0.0 para HTML equivalente
- Ou, mais seguro: manter o conteudo antigo como esta e detectar no frontend se e Markdown (comeca com `##`) ou HTML (comeca com `<`) para renderizar adequadamente

**Compatibilidade retroativa**:
- A pagina publica verificara se o conteudo comeca com `<` (HTML) ou nao (Markdown legado)
- Se for Markdown, usa ReactMarkdown; se for HTML, renderiza com DOMPurify
- Isso permite que releases antigas continuem funcionando sem migracao

