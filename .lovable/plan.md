

## Diagnóstico

O problema é que o texto das mensagens fica cortado no topo do chat. A imagem mostra claramente que a primeira mensagem visível está sendo "engolida" pelo header.

A causa raiz está na estrutura de layout: o container pai (`div.flex-1.flex.flex-col.overflow-hidden.p-4`) na linha 778 aplica `p-4` (padding em todos os lados), **mas** o `overflow-hidden` no wrapper do ScrollArea (linha 851) corta o conteúdo rente à borda. O `py-3` interno não resolve porque o Radix ScrollArea Viewport aplica `overflow: scroll` internamente — o padding do conteúdo funciona, mas o header do chat e o container externo podem estar sobrepondo visualmente.

O verdadeiro problema: o container do conteúdo (linha 778) usa `p-4` que dá padding, mas quando há as "ações rápidas" (linhas 832-849), elas ocupam espaço e o `flex-1` do ScrollArea se ajusta. Quando as mensagens existem e as ações rápidas somem, o ScrollArea ocupa todo o espaço — mas o `overflow-hidden` na div wrapper (linha 851) corta o conteúdo na borda superior sem margem.

## Plano de Correção

1. **Aumentar o padding vertical interno** do container de mensagens de `py-3` para `py-4` na linha 860.

2. **Adicionar `pt-1` ao wrapper do ScrollArea** (linha 851) para criar um respiro entre o topo do scroll e qualquer elemento acima (header ou ações rápidas que desapareceram).

3. **Alternativa mais robusta**: O `overflow-hidden` no wrapper div (linha 851) pode estar causando o clipping visual. Trocar para `overflow-clip` (que previne scroll mas não cria um novo contexto de formatação que esconde conteúdo nas bordas) ou simplesmente remover o `overflow-hidden` desse div e confiar apenas no ScrollArea para gerenciar o overflow.

**Abordagem recomendada**: Remover `overflow-hidden` da div wrapper (linha 851) já que o ScrollArea já gerencia seu próprio overflow internamente, e garantir padding `py-4` no container de mensagens.

