
# Correcoes Finais do Atlas: UX, Prompt e Navegacao Real

## Problemas Identificados

### 1. Respostas ainda longas para cumprimentos
O "Oi, tudo bem?" ainda gera resposta com mencao de cargos e permissoes. O prompt precisa ser ainda mais restritivo e os dados contextuais da empresa NAO devem ser enviados para mensagens simples.

### 2. Menciona cargo/permissoes sem ser perguntado
Na primeira resposta ao "Oi", Atlas cita: "Como voce tem perfil de gestor tanto no Strategy HUB quanto no AI Copilot...". Isso e indesejado. So deve falar de permissoes quando EXPLICITAMENTE perguntado ("Quais sao meus acessos?").

### 3. Navegacao incorreta
O PLATFORM_KNOWLEDGE atual diz "Clique no Pilar para expandir os Objetivos" e "Clique no + dentro do Objetivo para adicionar KR". Mas a estrutura real do sidebar e:

**STRATEGY HUB:**
- Dashboard (`/app/dashboard`)
- Mapa Estrategico (`/app/strategic-map`) -- aqui ficam Pilares, Objetivos e o botao de adicionar KR
- Objetivos (`/app/objectives`)
- Resultados Chave (`/app/indicators`) -- lista de KRs
- Projetos (`/app/projects`)
- Ferramentas (`/app/tools`) -- Golden Circle, SWOT, Alinhamento de Visao

**STARTUP HUB:**
- Dashboard, Avaliacao BEEP, Startups, Avaliacoes BEEP, Mentorias, Perfil Startup

O Atlas precisa conhecer EXATAMENTE essa estrutura.

### 4. Streaming progressivo indesejado
O usuario quer ver "digitando..." ate a mensagem estar 100% pronta, e so entao mostrar a mensagem completa (sem renderizacao token por token).

### 5. Auto-scroll para ultima mensagem
Quando envia mensagem, a tela deve rolar automaticamente ate o fim.

### 6. Atlas nao consegue executar acoes
O usuario pediu para o Atlas adicionar um KR, mas ele so sugere copiar/colar. Precisamos implementar a capacidade do Atlas de PROPOR acoes e, com aprovacao do usuario, EXECUTAR insercoes no banco.

---

## Plano de Acao

### Etapa 1: Eliminar streaming progressivo -- mostrar mensagem completa

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

Mudar a logica de streaming: em vez de renderizar token por token, acumular o conteudo completo internamente e so adicionar a mensagem ao chat quando o stream terminar (`[DONE]`).

Fluxo novo:
1. Usuario envia mensagem
2. Mostra "digitando..." (isLoading/isStreaming)
3. Internamente, acumula tokens numa variavel local (sem atualizar o estado do React)
4. Quando o stream termina, faz um unico `onMessagesChange` com a mensagem completa
5. "digitando..." desaparece e a mensagem aparece instantaneamente

### Etapa 2: Auto-scroll robusto

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

O `useEffect` atual ja tem scroll, mas o `scrollRef` referencia o `ScrollArea`. Garantir que o scroll funciona corretamente apos cada nova mensagem e apos o loading aparecer. Usar `setTimeout` para garantir que o DOM atualizou antes de scrollar.

### Etapa 3: Reformular o system prompt -- brevidade real

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Mudancas no prompt:
- PROIBIR mencao de cargos, permissoes, modulos ou dados da empresa em cumprimentos
- Permissoes so devem ser mencionadas quando o usuario PERGUNTAR sobre seus acessos ou quando ele pedir para fazer algo que nao tem permissao
- Remover o bloco que lista "sem acesso" (nao citar modulos que o usuario NAO tem)
- Adicionar regra: "NUNCA cite permissoes ou cargos a menos que o usuario pergunte 'quais sao meus acessos?' ou tente fazer algo sem permissao"

### Etapa 4: Atualizar PLATFORM_KNOWLEDGE com a navegacao REAL

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Reescrever completamente o guia de navegacao com a estrutura REAL do sidebar:

```text
## Menu Lateral (Sidebar) -- Estrutura Real

### STRATEGY HUB (se o usuario tem acesso ao modulo strategic-planning)
Os itens do menu lateral sao:
1. **Dashboard** - Visao geral com metricas e graficos de progresso
2. **Mapa Estrategico** - Visualizacao dos Pilares e Objetivos com cards expansiveis. E aqui que se adiciona KRs.
3. **Objetivos** - Lista de todos os Objetivos Estrategicos
4. **Resultados Chave** - Lista de todos os KRs com filtros e check-in
5. **Projetos** - Projetos Estrategicos vinculados ao plano
6. **Ferramentas** - Contem abas: Golden Circle, Analise SWOT, Alinhamento de Visao

### STARTUP HUB (se o usuario tem acesso ao modulo startup-hub)
1. **Dashboard** - Visao geral da startup
2. **Avaliacao BEEP** - Diagnostico de maturidade (so startups)
3. **Startups** - Lista de startups (so mentores)
4. **Avaliacoes BEEP** - Analytics de avaliacoes (so mentores)
5. **Mentorias** - Sessoes de mentoria e calendario
6. **Perfil Startup** - Dados da startup (so startups)

### Rodape do sidebar
- **Configuracoes** - Configuracoes da conta e empresa
```

E reescrever os passos como:
```text
### Como adicionar um KR
1. No menu lateral, clique em **"Mapa Estrategico"**
2. Localize o **Pilar** desejado (ex: Financeiro, Clientes, Inovacao)
3. Expanda o Pilar para ver seus **Objetivos**
4. Dentro do Objetivo, clique no botao **"Adicionar Resultado-Chave"** (ou no icone "+")
5. Preencha titulo, tipo de metrica, valor atual, meta e responsavel
6. Clique em **"Adicionar Resultado-Chave"**
```

### Etapa 5: Logica inteligente de contexto -- nao buscar dados para mensagens simples

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Implementar uma deteccao de intencao ANTES de buscar dados do banco. Se a mensagem for um cumprimento simples (regex ou lista de padroes), pular TODA a busca de dados contextuais (objectives, keyResults, projects, startup, mentoring). Isso tambem torna a resposta mais rapida.

```text
Padroes simples (pular busca de dados):
- "oi", "ola", "tudo bem", "bom dia", "boa tarde", "e ai", "como vai"
- "quem sou eu", "o que voce e", "o que e o strategy"
- "como faco para...", "como adicionar...", "onde fica..."
```

Para essas mensagens, enviar apenas o system prompt + historico + mensagem do usuario, SEM dados contextuais. Resultado: resposta em ~1 segundo.

### Etapa 6: Capacidade de agente -- propor e executar acoes

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Adicionar ao system prompt instrucoes de agente:
- Quando o usuario pedir para CRIAR algo (KR, objetivo, iniciativa, projeto), o Atlas deve montar um plano estruturado em formato claro e perguntar: "Posso prosseguir com essa criacao?"
- Nesta fase inicial: o Atlas ainda nao executa diretamente, mas apresenta o plano de forma que o usuario possa seguir os passos, com os valores ja preenchidos
- Adicionar no prompt: "Quando o usuario pedir para voce criar/adicionar algo, monte um plano detalhado com todos os campos preenchidos e pergunte se ele aprova. Explique que em breve voce podera executar automaticamente."

### Etapa 7: Nao mencionar modulos sem acesso

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Na construcao de `userPermissionLines`, remover o loop que adiciona modulos "sem acesso". O Atlas so precisa saber o que o usuario TEM acesso, nao o que nao tem.

---

## Arquivos a serem editados

1. **`src/components/ai/FloatingAIChat.tsx`**
   - Eliminar renderizacao progressiva (acumular stream, mostrar tudo no final)
   - Melhorar auto-scroll com setTimeout
   - Manter typing indicator visivel ate mensagem completa

2. **`supabase/functions/ai-chat/index.ts`**
   - Reescrever PLATFORM_KNOWLEDGE com navegacao real do sidebar
   - Adicionar deteccao de mensagem simples para pular busca de dados
   - Reforcar prompt: PROIBIR mencao de permissoes/cargos em cumprimentos
   - Remover listagem de modulos "sem acesso"
   - Adicionar instrucoes de agente (propor planos de criacao)

## Resultado Esperado

- "Oi" -> ~1s, resposta: "Ola, Bernardo! Como posso te ajudar?"  (sem mencao de cargo/permissao/dados)
- "Como adiciono um KR?" -> tutorial preciso: "Va em Mapa Estrategico no menu lateral..."
- "Quais sao meus acessos?" -> ai sim lista permissoes
- "Cria um KR de teste no pilar Inovacao" -> Atlas monta plano completo e pergunta se aprova
- Mensagem aparece completa (sem renderizacao progressiva)
- Chat rola automaticamente para ultima mensagem
