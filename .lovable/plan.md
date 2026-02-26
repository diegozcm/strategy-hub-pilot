

## Plano: Fix Atlas Hub Layout + Orb + Popup Visibility

### Problemas
1. `AtlasHubPage` usa `absolute inset-0` cobrindo tudo (sidebar, header)
2. O `AtlasOrb` tem CSS variables diferentes do orb do popup (blur, dot, shadow menores)
3. O DashboardHeader continua aparecendo, desperdicando espaço

### Mudanças

**1. `src/components/layout/AppLayout.tsx`**
- Quando `isOnAtlasHub`, esconder o `DashboardHeader` para o Atlas Hub ocupar 100% do espaço vertical
- O `<main>` quando no Atlas Hub: remover padding (`p-0`) e permitir overflow hidden

**2. `src/components/ai/AtlasHubPage.tsx`**
- Trocar `absolute inset-0` por `h-full w-full` — ele já está dentro do `<main>` que ocupa o espaço correto
- Remover qualquer margin negativa

**3. `src/components/ai/atlas/AtlasOrb.tsx`**
- Atualizar CSS variables para igualar ao popup: `--blur: 0.8px`, `--dot: 0.08rem`, `--shadow: 1.5rem`, `--spin-duration: 8s`

### Resultado
- Chat ocupa apenas a área do conteúdo (ao lado da sidebar do app), sem cobrir nada
- Header sumido no Atlas Hub = mais espaço para o chat
- Orb idêntico ao do popup em todos os lugares

