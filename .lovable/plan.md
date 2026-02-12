
# Duas Melhorias: Layout do Modal KR + Botao Atlas Interativo

## Melhoria 1: Ajustar Layout do Modal de Resultados-Chave

### Problema atual
O modal KR (`KROverviewModal.tsx`) tem `max-w-[1000px]`, e os botoes de acao e filtros de periodo ficam na mesma linha com `flex-wrap`, causando empilhamento e ma organizacao quando ha muitos botoes.

### Solucao
- Aumentar largura maxima do modal de `1000px` para `1280px`
- Reorganizar o bloco de botoes de acao e filtros de periodo em duas linhas distintas:
  - Linha 1: Botoes de acao (Atualizar Valores, FCA, Status Report, Iniciativas, Propriedades)
  - Linha 2: Filtros de periodo (YTD, Ano, Periodo) alinhados a esquerda com separador visual

### Arquivo afetado
| Arquivo | Acao |
|---------|------|
| `src/components/strategic-map/KROverviewModal.tsx` | Alterar max-w e reorganizar layout dos botoes/filtros |

---

## Melhoria 2: Botao Flutuante Atlas com Rosto Interativo e LED Azul

### Conceito
Substituir o botao simples com icone de robo por um personagem circular com rosto expressivo (inspirado no sol do flowfest.co.uk):
- Rosto desenhado em SVG com olhos que acompanham o cursor do mouse
- Expressao muda ao hover (sorriso abre mais, olhos "brilham")
- Contorno com efeito de LED azul animado girando ao redor do botao (conic-gradient animado)

### Detalhes tecnicos

**Componente `FloatingAIButton.tsx` - reescrita completa:**

1. **Rosto SVG interativo**:
   - Circulo com gradiente (usando cores da marca: azul claro `#38B6FF`)
   - Dois olhos (circulos pequenos) cujas posicoes `cx`/`cy` sao calculadas via `onMouseMove` global, criando o efeito de "seguir o mouse"
   - Boca (path SVG) que muda de um sorriso sutil para um sorriso aberto no hover
   - Transicao suave via CSS transition nas propriedades dos olhos

2. **Efeito LED azul animado no contorno**:
   - Container com `border-radius: 50%` e `padding: 3px`
   - Background com `conic-gradient` que gira usando CSS `@keyframes spin`:
     ```text
     @keyframes spin-glow {
       0% { transform: rotate(0deg); }
       100% { transform: rotate(360deg); }
     }
     ```
   - Gradiente conico com segmentos transparentes e azul brilhante (`#38B6FF`, `#0EA5E9`) criando o efeito de luz percorrendo a borda
   - Camada interna com background solido para "recortar" o gradiente, deixando apenas a borda visivel

3. **Interatividade**:
   - `useEffect` com listener `mousemove` no `window` para capturar posicao do mouse
   - Calculo do angulo e distancia entre mouse e centro do botao
   - Deslocamento dos olhos proporcional (max ~3px) na direcao do cursor
   - No hover: olhos se arregalam levemente (raio aumenta), boca abre mais

4. **Badge de notificacao**: Mantido como esta, posicionado no canto superior direito

### Animacoes CSS necessarias (em `index.css` ou `tailwind.config`):
- Novo keyframe `spin-glow` para rotacao do conic-gradient
- Classe utilitaria `animate-spin-glow` com duracao de ~3s linear infinite

### Arquivos afetados
| Arquivo | Acao |
|---------|------|
| `src/components/ai/FloatingAIButton.tsx` | Reescrever com rosto SVG interativo e efeito LED |
| `src/index.css` | Adicionar keyframe `spin-glow` para animacao do contorno LED |
