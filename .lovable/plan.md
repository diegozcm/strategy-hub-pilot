

# Corrigir Variedade de Cores do Orb

## Problema

Ao substituir `transparent` por `var(--base)` nos `conic-gradient`, as camadas de gradiente deixaram de se misturar entre si. Cada camada agora vai direto pro preto, escondendo as camadas abaixo e resultando em apenas uma faixa de azul visivel.

## Solucao

Duas mudancas combinadas:

### 1. Restaurar `transparent` nos gradientes (index.css)

Voltar os 6 `conic-gradient` para usar `transparent` nas faixas intermediarias. Isso permite que as camadas se sobreponham e criem a mistura organica de cores (azul claro, azul escuro, verde, ciano).

### 2. Ajustar as cores accent (FloatingAIButton.tsx)

Atualizar as 3 cores accent para garantir variedade visivel:

- `--accent1`: verde Cofound mais vibrante - `oklch(68% 0.22 150)` 
- `--accent2`: azul claro brilhante - `oklch(75% 0.22 230)`
- `--accent3`: ciano vibrante - `oklch(72% 0.20 200)`

Manter `--base` como preto (`oklch(10% 0.02 240)`) para o fundo.

### Secao Tecnica

**Arquivo `src/index.css`** (linhas 215-221): Reverter as 6 linhas de `conic-gradient`, trocando `var(--base)` de volta para `transparent` nas faixas intermediarias.

**Arquivo `src/components/ai/FloatingAIButton.tsx`** (linhas 42-44): Ajustar valores de `--accent1`, `--accent2`, `--accent3` para cores mais saturadas e variadas.

