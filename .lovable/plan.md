

# Abrir Modal de Objetivo direto do Mapa Estrategico

## Resumo

Ao clicar em "Adicionar Objetivo" dentro de um pilar no Mapa Estrategico, em vez de redirecionar para a pagina `/app/objectives`, o sistema vai abrir o modal `ObjectiveFormModal` que ja existe no componente, pre-selecionando automaticamente o pilar correspondente.

## O que muda para o usuario

- Clique em "Adicionar Objetivo" dentro de um pilar -> abre modal de criacao na propria tela
- O campo `pillar_id` ja vem preenchido automaticamente com o pilar onde o botao foi clicado
- Apos salvar, o objetivo aparece imediatamente no pilar sem sair da pagina

## Mudanca tecnica

**Arquivo:** `src/components/strategic-map/StrategicMapPage.tsx`

Apenas 2 linhas precisam mudar (linhas 517-518):

**De:**
```typescript
onClick={() => navigate('/app/objectives')}
```

**Para:**
```typescript
onClick={() => {
  setSelectedPillarId(pillar.id);
  setShowObjectiveForm(true);
}}
```

Isso reutiliza o estado `selectedPillarId` e `showObjectiveForm` que ja existem (linhas 67-68), e o modal `ObjectiveFormModal` ja esta renderizado na pagina (linhas 620-626) recebendo esses valores. Nenhum componente novo precisa ser criado.

