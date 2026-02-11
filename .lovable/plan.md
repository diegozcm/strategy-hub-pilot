
# Diagnostico e Plano: Fazer o Atlas Realmente Executar

## O Problema Real

O codigo do frontend (botoes Aprovar/Reprovar, chamada ao `ai-agent-execute`) e o backend (`ai-agent-execute` edge function) ja existem e estao corretos. O problema e que **o modelo de IA simplesmente ignora a instrucao de gerar blocos `[ATLAS_PLAN]`** e continua dizendo "nao tenho permissao".

**Causas raiz identificadas:**

1. **Historico envenenado**: As mensagens anteriores da conversa (salvas no banco) contem respostas como "eu nao tenho permissao para realizar cliques e gravacoes diretas". Quando o modelo ve esse historico, ele replica o mesmo comportamento -- modelos de linguagem tendem a seguir o padrao do historico.

2. **Instrucao perdida no meio do prompt**: A instrucao de agente esta enterrada na secao "Calibracao de Resposta" junto com dezenas de outras regras. O modelo prioriza o padrao do historico sobre uma instrucao no meio do prompt.

3. **Falta de enforcement no codigo**: O frontend confia que o modelo vai gerar `[ATLAS_PLAN]` naturalmente. Nao ha nenhum mecanismo de fallback quando o modelo se recusa.

## Plano de Correcao

### Etapa 1: Reescrever o system prompt com agente como prioridade #1

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Mover a instrucao de agente executor para o TOPO ABSOLUTO do prompt, ANTES de qualquer outra regra. Usar linguagem imperativa e repetitiva:

```
## VOCE E UM AGENTE EXECUTOR
Voce TEM a capacidade tecnica de criar Objetivos, KRs e Iniciativas no banco de dados da plataforma.
Quando o usuario pedir para criar/adicionar/inserir algo, voce DEVE gerar um bloco [ATLAS_PLAN] com o JSON.
O sistema backend ira processar esse bloco automaticamente.

PROIBIDO: Dizer que "nao pode", "nao tem permissao", "nao consegue executar" ou pedir para o usuario fazer manualmente.
Voce PODE e DEVE propor planos de execucao com [ATLAS_PLAN].
```

### Etapa 2: Sanitizar historico de conversa antes de enviar ao modelo

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Ao carregar `previousMessages` do banco, filtrar ou modificar mensagens antigas que contenham frases como "nao tenho permissao para executar", "nao consigo clicar", "faca voce mesmo". Isso impede que o modelo replique o comportamento antigo.

Implementacao: percorrer o array de mensagens do historico e, se uma mensagem de `assistant` contiver padroes como "nao tenho permissao" ou "nao consigo executar", substituir por uma versao que diz "Preparei o plano para execucao" (ou simplesmente remover a mensagem).

### Etapa 3: Adicionar deteccao de intencao de escrita no backend

**Arquivo**: `supabase/functions/ai-chat/index.ts`

Criar uma funcao `isWriteIntent(msg)` que detecta quando o usuario quer criar algo:
- "cria um", "adiciona um", "insere", "implementa", "cadastra", "coloca", "faz um objetivo", "quero que voce adicione"

Quando detectado, injetar uma mensagem de sistema EXTRA imediatamente antes da mensagem do usuario:
```
[system] "O usuario esta pedindo para CRIAR dados. Voce DEVE responder com um bloco [ATLAS_PLAN] contendo o JSON estruturado. NAO diga que nao pode. Voce e o agente executor."
```

Isso funciona como um "lembrete" forcado que o modelo recebe no momento exato em que precisa agir como agente.

### Etapa 4: Corrigir auto-scroll (reforco)

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

O sentinel `div` e `scrollIntoView` ja existem no codigo (linha 86 e 95-99). Verificar se o `useEffect` esta sendo disparado corretamente. O problema pode ser que o `ScrollArea` do Radix nao permite `scrollIntoView` no elemento interno. Alternativa: usar `querySelector('[data-radix-scroll-area-viewport]')` para obter o viewport real e fazer o scroll manualmente, como fallback.

### Etapa 5: Garantir que imagens aparecem nas mensagens do historico

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

As imagens ja sao renderizadas no template (linhas 523-529). O problema e que ao enviar, o `pastedImages` e limpo (linha 309) mas as imagens sao passadas na mensagem do usuario (linha 274). Verificar se a passagem esta correta e se as imagens persistem no array `messages`.

### Etapa 6: Indicador "planejando" quando detecta intencao de escrita

**Arquivo**: `src/components/ai/FloatingAIChat.tsx`

A logica atual (linha 418) mostra "planejando" quando `isLoading` e true (antes do stream comecar). Mudanca: quando `isWriteIntent` detecta uma mensagem de criacao, setar um estado `isPlanning = true` que muda o indicador para "planejando" durante o streaming tambem, nao so durante o loading inicial.

---

## Secao Tecnica: Detalhes de Implementacao

### Sanitizacao do historico (Etapa 2)

```
const REFUSAL_PATTERNS = [
  /n[aã]o tenho permiss[aã]o/i,
  /n[aã]o consigo (clicar|executar|inserir|gravar)/i,
  /fa[cç]a voc[eê] mesmo/i,
  /copie e cole/i,
  /trava de seguran[cç]a/i,
  /opera[cç][aã]o final de escrita/i,
];

function sanitizeHistory(messages) {
  return messages.map(msg => {
    if (msg.role === 'assistant' && REFUSAL_PATTERNS.some(p => p.test(msg.content))) {
      return { ...msg, content: 'Preparei um plano de execucao para o que voce pediu. Deseja que eu prossiga?' };
    }
    return msg;
  });
}
```

### Deteccao de intencao de escrita (Etapa 3)

```
function isWriteIntent(msg) {
  const normalized = msg.toLowerCase();
  const patterns = [
    /cri[ae]/i, /adicion[ae]/i, /inser[ei]/i, /implement[ae]/i,
    /cadastr[ae]/i, /coloc[ae]/i, /fa[zç]a? (um|uma|o|a)/i,
    /quero que (voc[eê]|tu) (cri|adicion|inser|implement|cadastr)/i,
    /pode (criar|adicionar|inserir|implementar|cadastrar)/i,
    /bota (isso|l[aá]|a[ií])/i,
  ];
  return patterns.some(p => p.test(normalized));
}
```

### Reforco de scroll (Etapa 4)

```
const scrollToBottom = useCallback(() => {
  setTimeout(() => {
    // Tentativa 1: sentinel div
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Fallback: viewport direto do Radix
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, 100);
}, []);
```

---

## Arquivos a editar

1. **`supabase/functions/ai-chat/index.ts`**
   - Reescrever o topo do system prompt com instrucoes de agente ANTES de tudo
   - Adicionar sanitizacao do historico (remover mensagens de recusa)
   - Adicionar deteccao `isWriteIntent` + mensagem de sistema extra
   - Reforcar no prompt FINAL que o Atlas NUNCA deve dizer que nao pode

2. **`src/components/ai/FloatingAIChat.tsx`**
   - Reforcar auto-scroll com fallback para viewport do Radix
   - Adicionar deteccao de `isWriteIntent` no frontend para mudar indicador para "planejando"
   - Garantir que imagens persistem corretamente no array de mensagens

3. **`supabase/functions/ai-agent-execute/index.ts`**
   - Sem mudancas necessarias -- ja esta correto

4. **`supabase/config.toml`**
   - Sem mudancas necessarias -- ja configurado

## Resultado Esperado

- Usuario: "Cria um KR de testes no pilar Inovacao" 
- Atlas: descreve o plano em linguagem natural + gera `[ATLAS_PLAN]` com JSON 
- Frontend: detecta o bloco, mostra botoes Aprovar/Reprovar
- Usuario clica Aprovar 
- Frontend chama `ai-agent-execute` 
- Dados sao inseridos no banco
- Atlas confirma: "Plano executado com sucesso!"
