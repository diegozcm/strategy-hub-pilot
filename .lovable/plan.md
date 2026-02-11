

# Identificacao do Usuario, Memoria de Conversa e Historico do Chat

## Problemas Identificados

### 1. IA nao identifica o usuario pelo nome
A edge function `ai-chat` nao busca o perfil do usuario (first_name, last_name) na tabela `profiles`. O prompt enviado a IA so menciona a empresa, entao quando o usuario pergunta "quem sou eu", a IA responde como se fosse a empresa falando — nao sabe o nome, cargo ou departamento do usuario.

### 2. Sem memoria de conversa (historico de mensagens)
A funcao envia apenas a mensagem atual para a IA. As mensagens anteriores da sessao (salvas em `ai_chat_messages`) nao sao carregadas e enviadas no array `messages`. Isso significa que a IA nao tem contexto das perguntas anteriores da mesma conversa.

### 3. Sem painel de historico de sessoes
O chat flutuante nao tem interface para listar sessoes anteriores, trocar entre elas, ou deletar conversas antigas.

### 4. Seguranca
As politicas RLS estao bem configuradas: INSERT tem WITH CHECK validando `auth.uid()` e `company_id`, SELECT filtra por `user_id` e `company_id`. A edge function valida JWT, verifica pertencimento a empresa, e usa service role key apenas para operacoes de leitura de dados contextuais. **A seguranca esta OK.**

---

## Plano de Acao

### Etapa 1: Buscar perfil do usuario na edge function
**Arquivo**: `supabase/functions/ai-chat/index.ts`
- Apos autenticar o usuario, buscar `first_name`, `last_name`, `position`, `department` da tabela `profiles`
- Incluir nome e cargo do usuario no system prompt e no contexto
- Exemplo: "Voce esta conversando com **Bernardo**, que ocupa o cargo de **Diretor** no departamento **Estrategia** da empresa COFOUND."

### Etapa 2: Carregar historico da sessao e enviar para a IA
**Arquivo**: `supabase/functions/ai-chat/index.ts`
- Buscar as ultimas N mensagens (ex: 20) da sessao atual em `ai_chat_messages`
- Montar o array `messages` com o historico completo: system prompt + mensagens anteriores + mensagem atual com contexto
- Isso da memoria a IA dentro da mesma sessao

### Etapa 3: Adicionar painel de historico no chat flutuante
**Arquivo**: `src/components/ai/FloatingAIChat.tsx`
- Adicionar botao de historico no header do chat
- Criar painel lateral/drawer listando sessoes anteriores (titulo, data)
- Ao clicar numa sessao, carregar suas mensagens
- Botao para criar nova conversa
- Botao para deletar sessao (ja tem RLS de DELETE configurado)

### Etapa 4: Carregar mensagens ao reabrir sessao
**Arquivo**: `src/components/ai/FloatingAIChat.tsx`
- Ao selecionar uma sessao do historico, buscar `ai_chat_messages` dessa sessao
- Renderizar no chat como se fosse a conversa atual

---

## Detalhes Tecnicos

### Busca do perfil (Etapa 1)
```text
// Na edge function, apos validar o usuario:
const { data: userProfile } = await supabase
  .from('profiles')
  .select('first_name, last_name, position, department')
  .eq('user_id', validUserId)
  .single();

const userName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ') || 'Usuario';
const userPosition = userProfile?.position || '';
const userDepartment = userProfile?.department || '';
```

Incluir no system prompt:
```text
`Voce esta conversando com ${userName}${userPosition ? `, ${userPosition}` : ''}${userDepartment ? ` do departamento ${userDepartment}` : ''} da empresa "${companyName}". Trate-o pelo nome e personalize suas respostas.`
```

### Historico de mensagens (Etapa 2)
```text
// Buscar mensagens anteriores da sessao
const { data: previousMessages } = await supabase
  .from('ai_chat_messages')
  .select('role, content')
  .eq('session_id', session_id)
  .order('created_at', { ascending: true })
  .limit(20);

// Montar array completo para a IA
const aiMessages = [
  { role: 'system', content: systemPrompt },
  ...(previousMessages || []).map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: contextPrompt }
];
```

### Interface de historico (Etapa 3)
- Icone de relogio/lista no header do chat
- Lista de sessoes com: titulo, data, preview da ultima mensagem
- Sessao ativa destacada
- Botao "Nova conversa" que cria sessao nova e limpa o chat
- Botao de lixeira em cada sessao para deletar

### Arquivos a serem editados
1. `supabase/functions/ai-chat/index.ts` - perfil do usuario + historico de mensagens
2. `src/components/ai/FloatingAIChat.tsx` - painel de historico + carregamento de sessoes

