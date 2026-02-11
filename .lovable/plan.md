
# Atlas: Agente Executor + Correcoes de UX

## Resumo dos Problemas e Solucoes

### 1. Atlas se recusa a implementar dados no sistema
O Atlas diz "nao tenho permissao" quando o usuario pede para criar OKRs. Precisamos transformar o Atlas em um **agente executor** que pode inserir dados diretamente no banco via uma nova edge function dedicada.

### 2. Auto-scroll nao funciona
O `scrollRef` aponta para o componente `ScrollArea` (Radix), mas o elemento que faz scroll e o `div[data-radix-scroll-area-viewport]` interno. O `scrollTop` nao funciona no wrapper externo.

### 3. Imagens coladas nao aparecem no historico do chat
As imagens sao enviadas para a IA mas nao sao renderizadas nas mensagens do usuario dentro do chat.

### 4. Indicador "digitando" vs "planejando"
Quando o Atlas esta preparando um plano de execucao, o indicador deve mudar de "digitando" para "planejando".

### 5. Prompt ainda despeja dados em cumprimentos
Apesar das regras, a IA continua mencionando cargos e dados nao solicitados.

---

## Plano de Acao

### Etapa 1: Criar edge function `ai-agent-execute`

**Novo arquivo**: `supabase/functions/ai-agent-execute/index.ts`

Uma edge function dedicada que recebe um plano estruturado (JSON) e executa as operacoes no banco de dados. Operacoes suportadas:
- `create_objective`: Insere em `strategic_objectives`
- `create_key_result`: Insere em `key_results`
- `create_initiative`: Insere em `kr_initiatives`

A funcao:
1. Valida o token JWT do usuario
2. Verifica que o usuario tem papel `manager` ou `admin` no modulo `strategic-planning`
3. Busca o `plan_id` ativo da empresa
4. Executa as insercoes em sequencia (objetivo -> KR -> iniciativas)
5. Retorna os IDs criados

### Etapa 2: Atualizar o system prompt para comportamento de agente

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Mudar as instrucoes de "eu nao posso fazer isso" para:
- Quando o usuario pede para criar algo, o Atlas monta um JSON estruturado dentro de um bloco especial `[ATLAS_PLAN]...[/ATLAS_PLAN]`
- O JSON contem: tipo de operacao, campos preenchidos, pilar/objetivo alvo
- Fora do bloco, o Atlas descreve o que vai fazer em linguagem natural e pergunta "Posso prosseguir?"

Formato do plano:
```text
[ATLAS_PLAN]
{
  "actions": [
    {
      "type": "create_objective",
      "data": { "title": "...", "pillar_name": "...", "description": "..." }
    },
    {
      "type": "create_key_result",
      "data": { "title": "...", "target_value": 30, "unit": "%", ... }
    },
    {
      "type": "create_initiative",
      "data": { "title": "...", "priority": "high", ... }
    }
  ]
}
[/ATLAS_PLAN]
```

### Etapa 3: Frontend -- detectar plano e mostrar botoes Aprovar/Reprovar

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

Quando a mensagem do assistente contem `[ATLAS_PLAN]...[/ATLAS_PLAN]`:
1. Parsear o JSON do plano
2. Renderizar a mensagem de texto SEM o bloco JSON (so a explicacao)
3. Mostrar dois botoes abaixo da mensagem: **"Aprovar"** (verde) e **"Reprovar"** (vermelho)
4. Ao clicar "Aprovar": chamar a edge function `ai-agent-execute` com o plano JSON
5. Mostrar resultado (sucesso com links para os itens criados, ou erro)
6. Ao clicar "Reprovar": adicionar mensagem "Plano recusado pelo usuario" e seguir conversa

### Etapa 4: Corrigir auto-scroll

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

O problema: `ScrollArea` do Radix UI cria um viewport interno. O `ref` no `ScrollArea` nao aponta para o elemento scrollavel.

Solucao: Em vez de `scrollRef` no `ScrollArea`, colocar um `div` invisivel (sentinel) no final da lista de mensagens e usar `scrollIntoView()`:

```text
// No final da lista de mensagens:
<div ref={messagesEndRef} />

// scrollToBottom:
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
```

### Etapa 5: Mostrar imagens coladas no historico do chat

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

Expandir a interface `ChatMessage` para incluir `images?: string[]` (ate 5).

Quando o usuario cola uma imagem e envia:
1. Armazenar a imagem (base64) na mensagem do usuario
2. Suportar ate 5 imagens simultaneas (array `pastedImages` em vez de `pastedImage`)
3. Renderizar as imagens como thumbnails na bolha da mensagem do usuario
4. Enviar todas as imagens para a edge function

### Etapa 6: Indicador "planejando" durante execucao de agente

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

Adicionar um novo estado `isPlanning` (boolean). O `TypingIndicator` recebe um prop para alternar o texto:
- `isLoading || isStreaming` -> "digitando"
- `isPlanning` -> "planejando"

Quando o usuario clica "Aprovar" no plano, o indicador muda para "executando..." ate a resposta da edge function.

### Etapa 7: Reforcar prompt -- brevidade em cumprimentos

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Ajustes finais:
- Mover TODA a informacao de permissoes para ser enviada APENAS quando `isSimpleMessage` retorna `false`
- Para mensagens simples, enviar um system prompt minimo (so identidade + regra de brevidade + nome do usuario)
- Isso elimina completamente a possibilidade da IA mencionar cargos em cumprimentos

---

## Detalhes Tecnicos

### Estrutura da edge function `ai-agent-execute`

```text
Entrada (POST):
{
  "company_id": "uuid",
  "actions": [
    { "type": "create_objective", "data": { "title": "...", "pillar_name": "Inovacao", "description": "..." } },
    { "type": "create_key_result", "data": { "title": "...", "target_value": 30, "unit": "%", "objective_ref": 0 } },
    { "type": "create_initiative", "data": { "title": "...", "key_result_ref": 0 } }
  ]
}

Saida:
{
  "success": true,
  "results": [
    { "type": "create_objective", "id": "uuid-criado", "title": "..." },
    { "type": "create_key_result", "id": "uuid-criado", "title": "..." },
    ...
  ]
}
```

O campo `objective_ref: 0` referencia o indice da action anterior no array (o objetivo criado no indice 0). Assim o KR se vincula ao objetivo recem-criado.

### Tabelas e campos obrigatorios

**strategic_objectives**: id, plan_id (NOT NULL), title, pillar_id (NOT NULL), owner_id (NOT NULL), status (default 'not_started')

**key_results**: id, objective_id (NOT NULL), title, target_value (NOT NULL), unit (NOT NULL), owner_id (NOT NULL)

**kr_initiatives**: id, key_result_id (NOT NULL), company_id (NOT NULL), title, start_date (NOT NULL), end_date (NOT NULL), status, priority, created_by (NOT NULL)

### Permissoes RLS
- `strategic_objectives`: INSERT permitido para usuarios da empresa
- `key_results`: INSERT permitido para managers
- `kr_initiatives`: INSERT permitido para managers

A edge function usara o `SUPABASE_SERVICE_ROLE_KEY` para inserir, mas validara as permissoes manualmente antes (checando `user_module_roles`).

### Correcao do scroll -- por que nao funciona

O componente `ScrollArea` do Radix cria esta estrutura:
```text
<ScrollArea ref={scrollRef}>        <-- ref aponta aqui (NAO e scrollavel)
  <div data-radix-scroll-area-viewport>  <-- ESTE e o scrollavel
    <div>  <-- conteudo
```

Portanto `scrollRef.current.scrollTop = scrollRef.current.scrollHeight` nao faz nada porque o elemento com `ref` nao e o que faz scroll.

Solucao com sentinel `div`:
```text
const messagesEndRef = useRef<HTMLDivElement>(null);

// Dentro do ScrollArea, apos o map de mensagens:
<div ref={messagesEndRef} />

// scrollToBottom:
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
```

### Suporte a multiplas imagens (ate 5)

Mudar de `pastedImage: string | null` para `pastedImages: string[]` (max 5).

Na UI, mostrar as imagens como grid de thumbnails com botao de remover individual.

---

## Arquivos a serem editados/criados

1. **`supabase/functions/ai-agent-execute/index.ts`** (NOVO)
   - Edge function para executar planos do Atlas no banco de dados
   - Validacao de permissoes, insercao de objectives/KRs/initiatives

2. **`supabase/functions/ai-chat/index.ts`**
   - Atualizar prompt para comportamento de agente (gerar `[ATLAS_PLAN]`)
   - Separar prompt minimo para mensagens simples (sem permissoes)
   - Reforcar brevidade

3. **`src/components/ai/FloatingAIChat.tsx`**
   - Corrigir auto-scroll com sentinel div + scrollIntoView
   - Detectar `[ATLAS_PLAN]` em mensagens e renderizar botoes Aprovar/Reprovar
   - Chamar `ai-agent-execute` ao aprovar
   - Mostrar imagens coladas no historico de mensagens
   - Suportar ate 5 imagens simultaneas
   - Indicadores dinamicos: "digitando", "planejando", "executando"

4. **`supabase/config.toml`**
   - Adicionar configuracao `[functions.ai-agent-execute]` com `verify_jwt = false`
