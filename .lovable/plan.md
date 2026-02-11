
# Fix: Fornecer nomes dos pilares ao LLM no contexto

## Problema raiz

O erro "Nome do pilar nao informado" ocorre porque a edge function `ai-chat` **nunca busca os pilares estrategicos** (`strategic_pillars`) da empresa. O LLM nao sabe quais pilares existem, entao gera o plano sem `pillar_name` ou com um nome inventado.

Os pilares da empresa COFOUND sao:
- Inovacao & Crescimento
- Pessoas & Cultura
- Economico & Financeiro.
- Mercado e Imagem
- Tecnologia e Processos

Mas o LLM nunca recebe essa lista.

## Correcao

### Arquivo: `supabase/functions/ai-chat/index.ts`

**1. Buscar pilares junto com os outros dados contextuais (linha ~345)**

Adicionar uma query paralela:
```typescript
supabase.from('strategic_pillars')
  .select('name')
  .eq('company_id', company_id)
```

**2. Incluir pilares no contexto enviado ao LLM (linha ~371)**

Adicionar no `contextParts`:
```
Pilares Estrategicos disponiveis: Inovacao & Crescimento, Pessoas & Cultura, ...
```

**3. Reforcar no system prompt (linha ~142)**

Alterar a regra do `pillar_name`:
```
- pillar_name DEVE ser EXATAMENTE um dos pilares listados no contexto da empresa. 
  Copie o nome exato. Nao invente pilares.
```

### Resultado esperado
- O LLM recebe a lista exata de pilares e consegue preencher `pillar_name` corretamente
- Eliminacao total do erro "Nome do pilar nao informado"
- Os planos gerados passam a funcionar na primeira tentativa
