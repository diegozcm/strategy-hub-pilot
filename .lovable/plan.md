

# Propriedades do Resultado-Chave: Taxa de Variacao com FCA Obrigatorio

## Resumo da Feature

Adicionar um botao "Propriedades" no modal do Resultado-Chave que abre um painel de configuracoes. A primeira propriedade sera uma **Taxa de Variacao (%)** que, quando ativada, bloqueia a atualizacao de valores se o novo valor ultrapassar o limite configurado (para cima ou para baixo) em relacao ao ultimo valor cadastrado -- exigindo que o usuario preencha e publique um FCA antes de confirmar a atualizacao.

---

## Fluxo do Usuario

```text
1. Usuario abre KR Overview Modal
2. Clica no botao "Propriedades" (novo botao na barra de acoes)
3. Popover/dialog abre com configuracoes:
   - Toggle: "Taxa de Variacao"
   - Input: percentual (ex: 15%)
4. Salva a configuracao

Ao atualizar valores (KRUpdateValuesModal):
5. Usuario digita novo valor para um mes
6. Sistema calcula: variacao = |novo - ultimo| / |ultimo| * 100
7. Se variacao > threshold configurado:
   a. Bloqueia o botao "Salvar"
   b. Exibe alerta: "Variacao de X% excede o limite de Y%. Preencha um FCA."
   c. Abre formulario de FCA inline ou redireciona para FCA modal
   d. Apos FCA ser criado com status "published", libera o salvamento
8. Se variacao <= threshold: salva normalmente
```

---

## 1. Alteracao no Banco de Dados

Adicionar coluna na tabela `key_results`:

```sql
ALTER TABLE key_results 
ADD COLUMN variation_threshold numeric DEFAULT NULL;
```

- `NULL` = feature desativada (sem verificacao)
- Valor numerico (ex: `15`) = threshold ativo em percentual

Adicionar coluna na tabela `kr_fca` para rastrear FCAs vinculados a atualizacoes bloqueadas:

```sql
ALTER TABLE kr_fca
ADD COLUMN linked_update_month varchar DEFAULT NULL,
ADD COLUMN linked_update_value numeric DEFAULT NULL;
```

---

## 2. Componente: KRPropertiesPopover (novo)

**Arquivo:** `src/components/strategic-map/KRPropertiesPopover.tsx`

- Popover (Radix) acionado pelo botao "Propriedades"
- Conteudo:
  - Toggle switch "Taxa de Variacao" (ativa/desativa)
  - Quando ativo: Input numerico para percentual (ex: 15%)
  - Botao "Salvar" que atualiza `key_results.variation_threshold` via Supabase
- Props: `keyResult`, `onSave` (callback para refresh)

---

## 3. Botao "Propriedades" no KROverviewModal

**Arquivo:** `src/components/strategic-map/KROverviewModal.tsx`

- Adicionar botao "Propriedades" na barra de acoes (ao lado de "Iniciativas")
- Icone: `Settings2` do Lucide
- Cor: roxo (para diferenciar dos outros botoes)
- Visivel apenas para usuarios com permissao `canEditThisKR`
- Abre o `KRPropertiesPopover`

---

## 4. Validacao no KRUpdateValuesModal

**Arquivo:** `src/components/strategic-map/KRUpdateValuesModal.tsx`

Logica de validacao antes do salvamento:

```text
Para cada mes com valor alterado:
  1. Buscar ultimo valor cadastrado (mes anterior com dado)
  2. Calcular variacao: |novo - ultimo| / |ultimo| * 100
  3. Se variacao > variation_threshold:
     - Marcar mes como "bloqueado"
     - Exibir alerta visual no campo
     - Bloquear submit geral

Se algum mes esta bloqueado:
  - Mostrar banner: "X mes(es) excedem a taxa de variacao de Y%"
  - Botao "Criar FCA" que abre KRFCAModal pre-preenchido
  - Apos FCA criado e publicado, desbloquear o mes
```

**Alteracoes especificas:**
- No `handleFormSubmit`: verificar se ha meses bloqueados antes de salvar
- Novo state: `blockedMonths: Record<string, { variation: number; fcaRequired: boolean; fcaId?: string }>`
- Funcao `checkVariationThreshold(monthKey, newValue)` para validar cada campo ao sair (onBlur)
- Indicador visual: borda vermelha + icone de alerta nos campos bloqueados

---

## 5. Integracao com FCA

Quando o threshold e excedido:
- Abrir `KRFCAModal` com dados pre-preenchidos:
  - `title`: "Variacao acima do limite em [Mes/Ano]"
  - `fact`: "Valor atualizado de [anterior] para [novo] (variacao de X%)"
  - `linked_update_month`: chave do mes (ex: "2026-02")
  - `linked_update_value`: valor novo proposto
- Apos FCA ser criado com status diferente de rascunho, o mes e desbloqueado
- Sistema verifica se existe FCA com `linked_update_month` correspondente para liberar

---

## Arquivos a Criar/Editar

| Arquivo | Acao |
|---------|------|
| `src/components/strategic-map/KRPropertiesPopover.tsx` | Criar |
| `src/components/strategic-map/KROverviewModal.tsx` | Editar - adicionar botao Propriedades |
| `src/components/strategic-map/KRUpdateValuesModal.tsx` | Editar - adicionar validacao de threshold |
| `src/types/strategic-map.ts` | Editar - adicionar `variation_threshold` ao KeyResult |
| Migracao SQL | Criar - adicionar colunas ao banco |

---

## Consideracoes

- A verificacao de threshold usa o **ultimo valor cadastrado** (mes anterior com dado no `monthly_actual`), nao a meta
- Se o KR nao tem nenhum valor anterior, nao ha bloqueio (primeiro valor e sempre livre)
- O threshold e bidirecional: bloqueia tanto aumentos quanto diminuicoes que excedam o percentual
- A propriedade fica salva no KR e vale para todos os usuarios que fazem check-in
- Apenas managers/admins podem configurar as propriedades

