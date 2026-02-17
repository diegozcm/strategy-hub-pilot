

# Plano: Diferenciar KRs com alerta pendente vs resolvido (Cards + Tabela RMRE)

## Problema atual

Hoje so existe um estado visual: "em alerta" (laranja). Nao ha distincao entre KRs que ja tiveram o FCA respondido e os que ainda estao pendentes. Alem disso, a borda laranja estatica no card nao ficou visualmente atrativa.

## Nova logica de estados

Cada KR com `variation_threshold` pode estar em 3 estados:

| Estado | Condicao | Significado |
|---|---|---|
| Sem alerta | Nao tem `variation_threshold` ou nenhum mes excede o limite | Nada a exibir |
| Alerta resolvido | Tem meses que excedem o limite, mas TODOS ja possuem FCA vinculado | Ja justificado |
| Alerta pendente | Tem meses que excedem o limite e PELO MENOS UM nao tem FCA | Precisa de atencao |

---

## Design visual

### Card - Alerta PENDENTE (sem FCA)

- Remover a borda `ring-2 ring-orange-400` estatica
- Adicionar animacao de "pulse wave" (ondas pulsantes de dentro pra fora) na borda do card em laranja
- Icone `AlertTriangle` laranja com tooltip "Variacao pendente de FCA" (ja existe, manter)
- A animacao sera um `@keyframes` customizado com box-shadow animado criando efeito de onda radiante laranja

```text
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+   <-- ondas pulsantes laranja
|  [Titulo do KR]           P:3   |
|  [Pilar]                        |
+----------------------------------+
| Atingimento YTD          59.7%   |
| [=========>          ]           |
|                                  |
| ⚠ ◉ ○ ○ ○    (icone laranja)    |
+~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~+
```

### Card - Alerta RESOLVIDO (FCA feito)

- Sem animacao de onda, sem borda especial
- Icone `CheckCircle` azul/verde ao lado dos indicadores mensais com tooltip "Variacao justificada via FCA"
- Visual discreto, so para informar que havia variacao mas ja foi tratada

```text
+----------------------------------+
|  [Titulo do KR]           P:3   |
|  [Pilar]                        |
+----------------------------------+
| Atingimento YTD          92.9%   |
| [==================>   ]         |
|                                  |
| ✓ ◉ ○ ○ ○    (icone azul)       |
+----------------------------------+
```

### Tabela RMRE - Alerta PENDENTE

- Fundo laranja sutil na linha (`bg-orange-50/40`) - manter como esta
- Icone `AlertTriangle` laranja ao lado do titulo - manter como esta
- Tooltip: "Variacao acima do limite sem FCA vinculado"

### Tabela RMRE - Alerta RESOLVIDO

- Fundo azul/verde sutil na linha (`bg-blue-50/30 dark:bg-blue-950/10`)
- Icone `CheckCircle` azul ao lado do titulo
- Tooltip: "Variacao justificada via FCA"

---

## Secao tecnica

### 1. `IndicatorsPage.tsx` - Novo calculo: `resolvedKRIds`

Adicionar um segundo `useMemo` que calcula os KRs com variacao que JA foram todos resolvidos:

```
Para cada KR com variation_threshold:
  Para cada mes com actual:
    Se variacao > threshold:
      Se NÃO tem FCA -> KR esta pendente (ja calculado em alertedKRIds)
  Se TODOS os meses com variacao tem FCA -> KR esta resolvido
```

Passa `resolvedKRIds` (Set) para `KRCard` e `KRTableView`.

### 2. `KRCard.tsx` - Nova prop `isResolved`

- Adicionar prop `isResolved?: boolean`
- Importar `CheckCircle` do lucide-react
- Remover `ring-2 ring-orange-400` da classe do Card
- Quando `isAlerted` (pendente): aplicar classe CSS com animacao de pulse-wave (keyframes customizado via Tailwind `animate-` ou inline style)
- Quando `isResolved`: mostrar icone `CheckCircle` azul com tooltip "Variacao justificada via FCA"
- Adicionar keyframes no `index.css` para a animacao de onda:

```css
@keyframes pulse-wave {
  0% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(251, 146, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0); }
}
```

### 3. `KRTableView.tsx` - Nova prop `resolvedKRIds`

- Adicionar prop `resolvedKRIds?: Set<string>`
- Na renderizacao de cada linha:
  - Se pendente (alertedKRIds): manter fundo laranja + icone laranja (atual)
  - Se resolvido (resolvedKRIds): fundo azul claro + icone `CheckCircle` azul + tooltip

### Resumo dos arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/indicators/IndicatorsPage.tsx` | Adicionar `resolvedKRIds` useMemo, passar para filhos |
| `src/components/indicators/KRCard.tsx` | Nova prop `isResolved`, animacao pulse-wave para pendente, icone azul para resolvido |
| `src/components/indicators/KRTableView.tsx` | Nova prop `resolvedKRIds`, fundo azul + icone para resolvidos |
| `src/index.css` | Keyframes `pulse-wave` para animacao de onda laranja |

