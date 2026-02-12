
# Reduzir Espacamento Superior e Redesenhar Cards de Metricas

## Problema identificado

1. **Espacamento vermelho**: A area entre os botoes de acao e os cards de metricas tem padding excessivo (`py-4` na linha dos botoes + `py-4` e `space-y-4` no container de conteudo). Isso cria um gap grande comparado a parte inferior do modal.

2. **Cards de metricas (area azul)**: Os 4 cards (Meta, Realizado, % Atingimento, Periodo Atual) usam `h-24` com `Card` completo (CardHeader + CardContent), ocupando altura desnecessaria.

## Solucao

### Arquivo: `src/components/strategic-map/KROverviewModal.tsx`
- Reduzir `py-4` para `py-2` na linha dos botoes de acao (linha 423)
- Reduzir `py-4` para `pt-2 pb-4` no container scrollavel (linha 518)

### Arquivo: `src/components/strategic-map/KeyResultMetrics.tsx`
- Substituir os 4 `Card` separados por um layout inline mais compacto
- Usar um unico container com divisores verticais entre as metricas
- Reduzir a altura dos cards de `h-24` para `h-auto` com padding minimo
- Layout: uma barra horizontal com os 4 valores lado a lado, sem bordas individuais pesadas
- Estilo: fundo sutil, texto compacto com label em cima e valor embaixo, icones menores
- Manter o card de "Periodo Atual" com o select funcional mas tambem compacto

## Secao Tecnica

**KROverviewModal.tsx** - Reducao de padding:
- Linha 423: `py-4` -> `py-2`
- Linha 518: `py-4` -> `pt-2 pb-4`
- Linha 143 (KeyResultMetrics): `space-y-4` -> `space-y-2`

**KeyResultMetrics.tsx** - Novo layout compacto:
- Trocar `grid grid-cols-4 gap-4` com cards `h-24` por um unico `Card` contendo uma grid interna de 4 colunas
- Cada coluna: label (text-xs) + valor (text-lg font-bold) + subinfo
- Separadores verticais (`border-r`) entre colunas
- Altura total reduzida de ~96px para ~64px
- Card de periodo mantem o Select funcional dentro da coluna compacta
