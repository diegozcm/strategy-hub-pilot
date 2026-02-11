

# Redesign dos Botoes do Chat Atlas: Microfone + Plan Toggle

## Resumo

Tres ajustes na barra de input do chat:

1. **Botao de microfone** - Quando gravando, trocar o icone para um quadrado dentro de circulo (icone `Square` do Lucide), sem piscar vermelho agressivo - apenas fundo vermelho solido
2. **Botao Plan** - Vira um toggle com texto "Plan" (como no Lovable). Quando ativo, fica destacado (azul). Quando ativo, a mensagem enviada forca o Atlas a criar um plano obrigatorio com Aprovar/Reprovar
3. **Layout** - Ordem: `[Input] [Mic/Stop] [Plan] [Send]`

---

## O que muda para o usuario

### Botao de audio
- Estado normal: icone de microfone
- Gravando: icone de quadrado (stop), fundo vermelho sem animacao pulsante

### Botao Plan
- Texto "Plan" com P maiusculo
- Funciona como toggle: clica para ativar, clica de novo para desativar
- Quando ativo: fundo azul (primary), texto claro
- Quando desativado: estilo outline normal
- Quando ativo, a mensagem do usuario e enviada com uma instrucao interna que obriga o Atlas a responder com um plano formal (com `[ATLAS_PLAN]`) que exige aprovacao

### Envio com Plan ativo
- O texto do usuario e enviado normalmente, mas internamente adiciona-se um prefixo/sufixo invisivel que instrui o Atlas: "O usuario esta no modo Plan. Voce DEVE responder com um plano detalhado humanizado seguido do bloco [ATLAS_PLAN]. O usuario precisara aprovar antes da execucao."
- O usuario nao ve essa instrucao, apenas sua mensagem original aparece no chat

---

## Secao Tecnica

### Arquivo: `src/components/ai/FloatingAIChat.tsx`

1. **Novo estado `isPlanMode`** (boolean, default false)

2. **Remover `handlePlanButton`** - nao sera mais necessario

3. **Importar `Square`** do lucide-react (substituir `ClipboardList` e `MicOff`)

4. **Botao de microfone (linhas 726-735):**
   ```tsx
   <Button
     onClick={toggleRecording}
     disabled={isLoading || isStreaming || isExecuting}
     size="icon"
     variant={isRecording ? "destructive" : "outline"}
     title={isRecording ? "Parar gravacao" : "Gravar audio"}
   >
     {isRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
   </Button>
   ```

5. **Botao Plan (linhas 736-744):**
   ```tsx
   <Button
     onClick={() => setIsPlanMode(prev => !prev)}
     disabled={isLoading || isStreaming || isExecuting}
     size="sm"
     variant={isPlanMode ? "default" : "outline"}
     className="text-xs font-medium px-3"
   >
     Plan
   </Button>
   ```

6. **handleSendMessage** - quando `isPlanMode` esta ativo, adicionar prefixo interno a mensagem enviada ao backend:
   ```typescript
   const effectiveMessage = isPlanMode
     ? `[MODO PLAN ATIVO] O usuario pede que voce elabore um plano detalhado e obrigatorio antes de executar. Responda com descricao humanizada + bloco [ATLAS_PLAN]. A mensagem do usuario e: ${textToSend}`
     : textToSend;
   ```
   - A `userMessage.content` exibida no chat continua sendo apenas `textToSend` (sem o prefixo)
   - O prefixo e enviado apenas no body do fetch para o backend

### Arquivo: `supabase/functions/ai-chat/index.ts`

Nenhuma mudanca necessaria - o prefixo `[MODO PLAN ATIVO]` na mensagem ja sera interpretado pelo LLM como instrucao para gerar o plano obrigatorio.

---

## Resultado esperado

- Microfone: icone limpo de quadrado (stop) quando gravando, sem piscamento
- Plan: toggle "Plan" textual, ativa/desativa modo de planejamento obrigatorio
- Layout: `[Input] [Mic] [Plan] [Enviar]`
