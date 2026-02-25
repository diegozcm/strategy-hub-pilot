

## Melhorias no Chat do Atlas

### Problema 1: Textarea nao reseta tamanho apos envio
Na linha 500, `setChatInput('')` limpa o texto mas nao reseta a altura do textarea. O elemento DOM mantem a altura expandida.

**Correcao:** Apos `setChatInput('')` na linha 500, adicionar reset da altura do textarea:
```typescript
setChatInput('');
if (textareaRef.current) {
  textareaRef.current.style.height = 'auto';
}
```

Tambem melhorar a scrollbar do textarea quando expandido — adicionar estilos CSS para scrollbar fina e semi-transparente no textarea.

---

### Problema 2: Scroll nao preserva posicao ao reabrir / falta botao "scroll to bottom"

**Causa:** O `useEffect` na linha 310-312 chama `scrollToBottom()` sempre que `messages` muda, inclusive ao reabrir. Quando o chat reabre, ele forca scroll para o final em vez de manter a posicao onde o usuario estava.

**Correcao:**
1. Guardar a posicao de scroll antes de fechar (via `useRef`) e restaurar ao reabrir, em vez de sempre scrollar ao fundo. O `scrollToBottom` automatico so deve acontecer quando **novas mensagens sao adicionadas** (comparar `messages.length` anterior), nao quando o chat simplesmente reabre.

2. Adicionar um estado `showScrollToBottom` que aparece quando o usuario nao esta no fundo da conversa. Monitorar o evento `onScroll` do viewport do `ScrollArea` — se `scrollTop + clientHeight < scrollHeight - 100`, mostrar o botao. Ao clicar, scroll suave ate o fim e esconder o botao.

**Implementacao:**
- `scrollPositionRef = useRef<number>(0)` — salva posicao
- `prevMessageCountRef = useRef<number>(0)` — detecta novas msgs
- `showScrollToBottom` estado — controla visibilidade do botao
- No `useEffect` de `isOpen`: ao abrir, restaurar scroll salvo; ao fechar, salvar posicao atual
- No `useEffect` de `messages`: so chamar `scrollToBottom` se `messages.length > prevMessageCountRef`
- Botao flutuante com `ChevronDown` na parte inferior do ScrollArea

---

### Problema 3: Botao de copiar conteudo das mensagens

**Implementacao:** Adicionar um botao de copiar (icone `Copy`) que aparece em cada mensagem (user e assistant), ao lado dos botoes de feedback existentes para mensagens do assistant, e como unico botao de acao para mensagens do user.

- Para mensagens do assistant: adicionar `Copy` ao lado de `RefreshCw`, `ThumbsUp`, `ThumbsDown` (linha 864-908)
- Para mensagens do user: adicionar uma barra com o botao `Copy` no hover
- Ao clicar, copiar `msg.content` para clipboard e mostrar feedback visual (icone muda para `Check` por 2 segundos)

**Detalhes:**
- Estado `copiedIndex` para rastrear qual mensagem foi copiada
- `navigator.clipboard.writeText(msg.content)`
- Icone `Copy` do lucide-react (ja disponivel no projeto)

---

### Arquivo modificado
`src/components/ai/FloatingAIChat.tsx`

### Resumo das alteracoes:
1. Reset de textarea height apos envio + scrollbar styling
2. Preservar posicao de scroll ao reabrir + botao "ir ao final" flutuante
3. Botao copiar em todas as mensagens (user e assistant)

