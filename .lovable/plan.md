

# Redesign das Notificacoes (Toasts) com Identidade COFOUND

## Resumo
Alterar o estilo e posicionamento das notificacoes do sistema para aparecerem centralizadas na parte inferior da tela, com animacao de entrada de baixo para cima e saida de cima para baixo. Design mais fino, com cantos arredondados e cores COFOUND. Erros usarao vermelho.

## O que muda visualmente
- Posicao: de canto inferior direito para **centro inferior** da tela
- Formato: mais fino/compacto (padding reduzido de p-6 para py-3 px-5)
- Cantos: mais arredondados (rounded-xl)
- Animacao: entrada de baixo para cima, saida para baixo (em vez de deslizar para a direita)
- Cor padrao (sucesso): fundo branco com borda verde COFOUND (#CDD966), texto navy (#10283F)
- Cor erro (destructive): fundo vermelho suave com borda vermelha, texto vermelho escuro
- Largura maxima reduzida para ficar mais elegante

## Detalhes Tecnicos

### 1. `src/components/ui/toast.tsx` - ToastViewport
Alterar o posicionamento do viewport:
- De: `fixed top-0 ... sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]`
- Para: `fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-auto flex-col p-4 max-w-[480px]`
- Centralizado horizontalmente com `left-1/2 -translate-x-1/2`

### 2. `src/components/ui/toast.tsx` - toastVariants
Alterar o estilo do toast:
- Padding mais compacto: `py-3 px-5` em vez de `p-6 pr-8`
- Cantos mais arredondados: `rounded-xl`
- Animacoes: trocar `slide-in-from-top/bottom` por `slide-in-from-bottom-full` na entrada e `slide-out-to-bottom-full` na saida
- Variante default: borda verde COFOUND `border-[#CDD966]`, fundo branco, texto navy `text-[#10283F]`
- Variante destructive: borda vermelha `border-red-500`, fundo `bg-red-50`, texto `text-red-800`

### 3. `src/components/ui/sonner.tsx` - Toaster do Sonner
Alterar o posicionamento e estilo do Sonner (usado nas paginas admin-v2):
- Adicionar `position="bottom-center"` no componente Sonner
- Atualizar classNames para seguir o mesmo visual COFOUND

### Arquivos alterados
1. `src/components/ui/toast.tsx` - viewport + variantes
2. `src/components/ui/sonner.tsx` - posicao e estilos

