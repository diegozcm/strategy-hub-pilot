

## Diagnóstico

O botão do Atlas Hub na sidebar tem dois problemas principais:

1. **Orb sem cor / escuro demais**: O orb no sidebar usa `--base: oklch(15% 0.03 220)` (quase preto) com `--contrast: 2.5` que "queima" as cores. O orb original (referência na imagem) é vibrante com azul ciano, verde vivo e reflexos — precisa de cores mais saturadas e luminosas, base menos opaca, e contrast/blur balanceados.

2. **Background flat e sem personalidade**: Atualmente é um `bg-[hsl(var(--cofound-blue-light))]` sólido — parece um botão genérico. Precisa de profundidade, gradiente sutil e acabamento premium.

## Plano de implementação

### 1. Corrigir o Orb no Sidebar (Sidebar.tsx, linhas 127-140)

Ajustar as variáveis CSS do orb inline para replicar a aparência colorida da referência:

- `--base`: `oklch(5% 0.01 240)` — base mais escura e neutra para as cores "saltarem"
- `--accent1`: `oklch(72% 0.28 155)` — verde vibrante e saturado
- `--accent2`: `oklch(70% 0.25 230)` — azul ciano forte
- `--accent3`: `oklch(65% 0.22 195)` — teal/ciano intermediário
- `--blur`: `0.3px` — menos blur para mais definição nas cores
- `--contrast`: `1.8` — reduzir para não "queimar" os gradientes
- `--dot`: `0.05rem` — dot pattern mais fino e elegante
- `--shadow`: `1rem` — manter
- `--mask`: `8%` — leve ajuste para revelar mais cor
- `--spin-duration`: `4s` — rotação média, viva mas não frenética
- Aumentar o tamanho do orb de **28px para 36px** para ter mais presença visual

### 2. Redesenhar o fundo do botão (Sidebar.tsx, linha 124)

Substituir o background azul claro sólido por um fundo navy escuro premium com gradiente sutil, retornando ao conceito dark que combina com o orb:

- Background: gradiente `from-[#0B1D30] via-[#0E263D] to-[#0B1D30]` (navy COFOUND)
- Texto: branco com opacidade alta, subtítulo em verde COFOUND
- Padding levemente maior para dar mais "respiro"
- Classe `atlas-hub-btn-inner` reaproveitada para shimmer animado
- Adicionar `backdrop-blur` e borda sutil `border border-white/5`
- Hover: brilho sutil com `group-hover:shadow-[0_0_20px_rgba(56,182,255,0.15)]`

### 3. Atualizar CSS do atlas-hub-btn-inner (index.css, linhas 281-320)

Refinar o background animado do inner para ser mais sofisticado:
- Gradiente base com navy profundo
- `::before` com manchas de cor azul/verde mais visíveis (opacidade ~12%)
- `::after` shimmer com sweep mais lento e elegante

### 4. Atualizar o AtlasOrb.tsx padrão (AtlasOrb.tsx)

Sincronizar as cores do componente reutilizável `AtlasOrb` com os mesmos valores vibrantes, para que todos os orbs do sistema (chat, welcome, message bubbles) tenham a mesma aparência colorida da referência.

### Detalhes técnicos

Arquivos modificados:
- `src/components/layout/Sidebar.tsx` — orb vars, tamanho, layout do botão, cores de texto
- `src/index.css` — refinamento do atlas-hub-btn-inner e pseudo-elements
- `src/components/ai/atlas/AtlasOrb.tsx` — atualizar orbStyle padrão com cores vibrantes

