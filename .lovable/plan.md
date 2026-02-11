
# Melhorias no Chat do Atlas: Microfone, Botao de Plano e Plano Humanizado

## Resumo

Vamos adicionar 3 funcionalidades ao chat do Atlas:

1. **Botao de microfone** - Gravar audio por voz, transcrever automaticamente e enviar como texto
2. **Botao de planejamento** - Acao rapida para pedir ao Atlas que elabore um plano estrategico
3. **Plano 100% humanizado** - O JSON tecnico ([ATLAS_PLAN]) nunca aparece para o usuario. O Atlas descreve em texto natural o que vai fazer, e o codigo fica completamente invisivel

---

## O que muda para o usuario

### Barra de entrada (area de digitar mensagem)

A barra de input tera 3 botoes ao lado:

```text
[  Digite sua mensagem...  ] [Mic] [Plan] [Enviar]
```

- **Mic (microfone)**: Clica para comecar a gravar. O botao fica vermelho pulsando. Clica de novo para parar. O audio e transcrito automaticamente e o texto aparece no campo de input, pronto para enviar.
- **Plan (planejamento)**: Clica e o Atlas recebe um pedido automatico: "Analise minha situacao estrategica atual e proponha um plano de acoes". O usuario pode editar antes de enviar.
- **Enviar**: Igual ao atual.

### Gravacao de audio
- Usa a API nativa do navegador (Web Speech API) para transcricao em tempo real
- Nao precisa de API externa nem custos adicionais
- Funciona em Chrome, Edge e outros navegadores modernos
- Enquanto grava, o texto vai aparecendo no campo de input em tempo real
- Ao parar, o texto final fica no input para o usuario revisar/editar antes de enviar

### Plano humanizado
- O Atlas ja descreve o plano em texto natural (como nas screenshots que voce enviou: "Novo Objetivo: ...", "KRs: ...", "Iniciativas: ...")
- O bloco `[ATLAS_PLAN]...` com o JSON tecnico sera **completamente removido** da exibicao
- O usuario ve apenas o texto descritivo + botoes Aprovar/Reprovar
- O codigo JSON fica armazenado internamente para execucao, mas NUNCA e mostrado

---

## Secao Tecnica

### Arquivo 1: `src/components/ai/FloatingAIChat.tsx`

**Mudancas:**

1. **Adicionar estado para gravacao de audio:**
   - `isRecording` (boolean)
   - `recognition` (ref para SpeechRecognition)

2. **Funcao `toggleRecording`:**
   - Se nao esta gravando: inicia `SpeechRecognition` com `lang: 'pt-BR'`, `continuous: true`, `interimResults: true`
   - `onresult`: atualiza `chatInput` com o texto transcrito em tempo real
   - Se esta gravando: para o `SpeechRecognition`

3. **Botao de microfone no JSX:**
   - Icone `Mic` (do lucide-react) ao lado do input
   - Quando gravando: icone `MicOff` com estilo vermelho pulsante
   - Disabled quando `isLoading || isStreaming || isExecuting`

4. **Botao de planejamento:**
   - Icone `ClipboardList` (do lucide-react)
   - Ao clicar: preenche o input com "Analise a situacao estrategica atual da empresa e proponha um plano de acoes com objetivos, KRs e iniciativas"
   - O usuario pode editar antes de enviar

5. **Layout da barra de input:**
   ```
   <div className="flex gap-2 mt-4">
     <Input ... className="flex-1" />
     <Button (mic) />
     <Button (plan) />
     <Button (send) />
   </div>
   ```

6. **extractPlan - garantir que cleanContent nunca mostra o JSON:**
   - O `extractPlan` ja remove o bloco `[ATLAS_PLAN]...[/ATLAS_PLAN]` do `cleanContent`
   - Verificar e reforcar que qualquer rastro de JSON e removido
   - Adicionar limpeza extra para remover a frase "Preparei o plano acima..." (redundante se os botoes ja aparecem)

### Arquivo 2: `supabase/functions/ai-chat/index.ts`

**Mudanca no prompt:**

Reforcar no `buildSystemPrompt` que a descricao humanizada deve ser DETALHADA:

```
- ANTES do bloco [ATLAS_PLAN], descreva detalhadamente em linguagem natural e humanizada:
  * Qual o objetivo que sera criado e por que
  * Quais KRs serao vinculados e suas metas
  * Quais iniciativas serao propostas
  * Use marcadores numerados (1., 2., 3.) para organizar
  * Seja especifico: inclua nomes, valores, datas
  * Tom conversacional e claro para qualquer usuario entender
- O bloco [ATLAS_PLAN] com JSON e SOMENTE para uso interno do sistema. O usuario NUNCA vera esse codigo.
```

---

## Arquivos a editar

1. **`src/components/ai/FloatingAIChat.tsx`** - Adicionar botoes de microfone e planejamento, melhorar extractPlan
2. **`supabase/functions/ai-chat/index.ts`** - Reforcar prompt para descricoes humanizadas detalhadas

## Resultado esperado

- Usuario clica no microfone, fala, clica de novo, texto aparece no input
- Usuario clica no botao de plano, prompt pre-preenchido aparece
- Atlas responde com texto humanizado detalhado + botoes Aprovar/Reprovar
- JSON tecnico NUNCA aparece na interface
