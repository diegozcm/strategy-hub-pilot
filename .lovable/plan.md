
# Evolucao do Atlas: Inteligencia, Permissoes, UX e Capacidades

## Resumo das Mudancas

1. Renomear "Account Pilot" para **Atlas** em toda a plataforma
2. Corrigir typing indicator (remover "..." extra)
3. Resolver IA que ainda despeja dados em cumprimentos simples
4. Adicionar conhecimento detalhado de navegacao da UI (passo a passo correto para cada ferramenta)
5. Buscar permissoes do usuario e adaptar orientacoes
6. Suporte a colar imagem (Ctrl+V) no chat
7. Capacidade de agente: planejar acoes de escrita com aprovacao do usuario (fase futura - planejamento)

---

## Etapa 1: Renomear para Atlas

**Arquivos afetados**: `FloatingAIChat.tsx`, `ai-chat/index.ts`

- Trocar todas as ocorrencias de "Account Pilot" por "Atlas"
- No header do chat: "Atlas" em vez de "Account Pilot"
- No system prompt: "Voce e o Atlas, o assistente..."
- No PLATFORM_KNOWLEDGE: atualizar a secao sobre o proprio assistente

---

## Etapa 2: Corrigir Typing Indicator

**Arquivo**: `FloatingAIChat.tsx` (linhas 40-51)

Problema: O usuario ve `[3 bolinhas] digitando...` — os "..." no texto sao redundantes com as bolinhas.

Mudanca: Trocar `digitando...` por apenas `digitando` (sem os tres pontos):
```text
<span className="text-xs text-muted-foreground ml-1.5">digitando</span>
```

---

## Etapa 3: Resolver IA que ignora regras de calibracao

**Arquivo**: `ai-chat/index.ts`

O problema persiste porque mesmo com as regras no prompt, o contexto da empresa e enviado como segunda mensagem de sistema em TODA requisicao. Modelos de IA tendem a usar dados que recebem.

**Solucao em 2 partes:**

### 3a. Mover contexto de dados para DEPOIS do historico
A ordem atual:
```text
[system] prompt principal
[system] dados da empresa  <-- IA ve dados cedo e se sente compelida a usa-los
[historico]
[user] mensagem
```

Nova ordem:
```text
[system] prompt principal (com regras de calibracao reforçadas)
[historico]
[user] mensagem
[system] dados da empresa (com instrucao: "CONTEXTO DE REFERENCIA - use APENAS se a mensagem acima pedir dados")
```

### 3b. Reforcar o prompt com repeticao da regra
No inicio E no fim do system prompt, repetir a regra critica. Modelos seguem instrucoes no inicio e no fim mais fielmente do que no meio.

---

## Etapa 4: Conhecimento detalhado da UI

**Arquivo**: `ai-chat/index.ts` (constante PLATFORM_KNOWLEDGE)

Expandir o PLATFORM_KNOWLEDGE com instrucoes passo a passo de navegacao para cada modulo, incluindo os nomes exatos dos botoes e onde ficam:

```text
## Guia de Navegacao Detalhado

### Como adicionar um KR (Resultado-Chave)
1. No menu lateral, clique em "Strategy Hub"
2. Na tela principal, localize os Pilares Estrategicos
3. Clique no Pilar desejado para expandir seus Objetivos
4. Dentro do Objetivo, clique no botao "+" ao lado de "Resultados-Chave"
5. Preencha: titulo, tipo de metrica (numero, %, moeda), valor atual, meta, responsavel
6. Clique em "Salvar"
NOTA: Apenas usuarios com papel de gestor ou admin no modulo Strategy Hub podem criar KRs.

### Como fazer check-in de um KR
1. Localize o KR no Strategy Hub
2. Clique no KR para abrir os detalhes
3. Atualize o valor atual
4. Salve
NOTA: Members podem fazer check-in apenas nos KRs onde sao o responsavel atribuido.

[... instrucoes similares para cada funcionalidade ...]
```

---

## Etapa 5: Buscar permissoes do usuario

**Arquivo**: `ai-chat/index.ts`

Na edge function, buscar os modulos e papeis do usuario usando a tabela `user_module_roles`:

```text
// Buscar papeis do usuario nos modulos
const { data: userModuleRoles } = await supabase
  .from('user_module_roles')
  .select('module_id, role, active, system_modules!inner(name, slug)')
  .eq('user_id', validUserId)
  .eq('active', true);
```

Incluir no contexto do prompt:
```text
Permissoes de ${userName}:
- Strategy Hub: gestor (pode criar, editar e deletar)
- Startup Hub: membro (somente leitura, check-in nos seus KRs)
- Mentoria: sem acesso

IMPORTANTE: Quando o usuario perguntar como fazer algo, VERIFIQUE se ele tem permissao.
Se nao tiver, informe educadamente que ele precisa de acesso ao modulo.
```

---

## Etapa 6: Suporte a colar imagem (Ctrl+V)

**Arquivo**: `FloatingAIChat.tsx`

Adicionar handler de `onPaste` no container do chat ou no Input:

1. Detectar `event.clipboardData.files` com tipo `image/*`
2. Converter para base64 ou fazer upload para Supabase Storage
3. Mostrar preview da imagem no chat como mensagem do usuario
4. Enviar a imagem como parte da mensagem para a edge function

**Arquivo**: `ai-chat/index.ts`

Atualizar para suportar mensagens multimodais (content com array de `text` e `image_url`):
```text
// Mensagem com imagem
{
  role: 'user',
  content: [
    { type: 'text', text: 'Analise esta imagem' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
  ]
}
```

Nota: O modelo precisa suportar visao (ex: gemini-3-flash-preview suporta). Sera necessario verificar se o modelo selecionado suporta imagens.

---

## Etapa 7: Capacidade de agente (escrita com aprovacao) - Planejamento inicial

Esta etapa e mais complexa e sera implementada como fundacao para evolucao futura.

**Conceito**: Quando o usuario pede para "adicionar um KR" ou "criar um projeto", o Atlas:
1. Identifica a intencao de escrita
2. Monta um plano estruturado (JSON)
3. Apresenta o plano ao usuario no chat com botoes "Aprovar" / "Recusar"
4. Se aprovado, executa via edge function com permissoes validadas

**Nesta fase, implementaremos apenas:**
- Mensagem do Atlas reconhecendo que no futuro podera executar acoes
- Resposta atualizada: "Por enquanto, sigo como seu guia estrategico. Em breve, poderei executar acoes diretamente para voce!"
- Estrutura preparatoria no codigo para futura implementacao (sem escrita real ainda)

---

## Arquivos a serem editados

1. `supabase/functions/ai-chat/index.ts`
   - Renomear para Atlas
   - Expandir PLATFORM_KNOWLEDGE com guia de navegacao detalhado
   - Buscar e incluir permissoes do usuario (user_module_roles)
   - Reordenar mensagens para colocar contexto de dados apos historico
   - Reforcar regras de calibracao no prompt
   - Suportar mensagens multimodais (imagens)

2. `src/components/ai/FloatingAIChat.tsx`
   - Renomear para Atlas no header
   - Corrigir "digitando..." para "digitando"
   - Adicionar handler onPaste para imagens (Ctrl+V)
   - Mostrar preview de imagem colada no chat
   - Enviar imagem como base64 para a edge function

## Resultado Esperado

- "Oi" -> resposta em 1-2 frases: "Ola, Bernardo! Como posso te ajudar?"
- "Como adiciono um KR?" -> tutorial preciso com nomes corretos de botoes, verificando se o usuario tem permissao
- Imagem colada -> Atlas analisa e responde sobre o conteudo
- Typing indicator limpo: bolinhas + "digitando" (sem "..." extra)
- Nome "Atlas" em todo o chat
