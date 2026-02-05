

# Plano: Redesign do Formulário Inline de Criação de KR

## Problema Identificado

O formulário atual (`InlineKeyResultForm.tsx`) apresenta os seguintes problemas:

1. **Layout muito vertical** - Não cabe bem em telas pequenas
2. **Frequência das metas incorreta** - Deveria mostrar badge + descrição como na edição
3. **"Como calcular a meta"** - Campo não existe, mas deveria ser um Select (não número)
4. **Falta campo "Direcionamento"** - Opções "Maior é melhor" / "Menor é melhor" não estão presentes

---

## Referência Visual (Modal de Edição KREditModal)

O formulário deve seguir o mesmo padrão do modal de edição, que já possui:

- **Frequência** com badges coloridos + texto descritivo:
  - "Mensal" (badge azul) + "12 metas por ano"
  - "Bimestral" (badge teal) + "6 metas por ano (B1-B6)"
  - etc.

- **Como calcular a meta** com Select de opções:
  - Somar todas as metas
  - Calcular a média das metas
  - Usar o maior valor entre as metas
  - Usar o menor valor entre as metas
  - Usar o último valor registrado

- **Direcionamento** com Select visual:
  - "Maior é melhor" + descrição + emoji
  - "Menor é melhor" + descrição + emoji

---

## Novo Layout Proposto

O formulário será reorganizado em um layout mais horizontal e compacto:

```
┌─────────────────────────────────────────────────────────────┐
│ ← Novo Resultado-Chave                                      │
│    Vinculado ao objetivo: [Badge: Nome do Objetivo]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nome do Resultado-Chave *                                   │
│ [____________________________________________________]     │
│                                                             │
│ ┌──────────────────────────┐ ┌─────────────────────────────┐│
│ │ Dono do KR               │ │ Vigência                    ││
│ │ [Select                 v] │ [Select                   v] │
│ └──────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ ┌──────────────────────────┐ ┌─────────────────────────────┐│
│ │ Direcionamento *         │ │ Frequência das Metas        ││
│ │ [📈 Maior é melhor     v] │ [Mensal | 12 metas/ano     v] │
│ └──────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ ┌──────────────────────────┐ ┌─────────────────────────────┐│
│ │ Meta *                   │ │ Unidade                     ││
│ │ [100                    ] │ [% (Percentual)            v] │
│ └──────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ ┌──────────────────────────┐ ┌─────────────────────────────┐│
│ │ Como calcular a meta?    │ │ Peso (1-10)                 ││
│ │ [Somar todas as metas  v] │ [1                          ] │
│ └──────────────────────────┘ └─────────────────────────────┘│
│                                                             │
│ Descrição (opcional)                                        │
│ [________________________________________________ (2 rows)] │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                         [Cancelar] [Criar Resultado-Chave]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Alterações no Código

### 1. Adicionar novos campos ao estado

```typescript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  target_value: '',
  unit: '%',
  frequency: 'monthly' as KRFrequency,
  start_month: '',
  end_month: '',
  assigned_owner_id: '',
  weight: 1,
  // NOVOS CAMPOS:
  target_direction: 'maximize' as TargetDirection,
  aggregation_type: 'sum' as 'sum' | 'average' | 'max' | 'min' | 'last'
});
```

### 2. Adicionar imports necessários

```typescript
import { getDirectionLabel, getDirectionDescription, type TargetDirection } from '@/lib/krHelpers';
import { 
  KRFrequency, 
  getFrequencyBadgeColor 
} from '@/lib/krFrequencyHelpers';
import { cn } from '@/lib/utils';
```

### 3. Novo campo "Direcionamento"

Seguindo o mesmo padrão do KREditModal (linhas 549-581):

```tsx
<Select 
  value={formData.target_direction} 
  onValueChange={(value: TargetDirection) => setFormData({...formData, target_direction: value})}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="maximize">
      <div className="flex flex-col">
        <span>{getDirectionLabel('maximize')}</span>
        <span className="text-xs text-muted-foreground">{getDirectionDescription('maximize')}</span>
      </div>
    </SelectItem>
    <SelectItem value="minimize">
      <div className="flex flex-col">
        <span>{getDirectionLabel('minimize')}</span>
        <span className="text-xs text-muted-foreground">{getDirectionDescription('minimize')}</span>
      </div>
    </SelectItem>
  </SelectContent>
</Select>
```

### 4. Novo campo "Frequência das Metas" (com badges)

Seguindo o padrão do KREditModal (linhas 583-638):

```tsx
<Select 
  value={formData.frequency} 
  onValueChange={(value: KRFrequency) => setFormData({...formData, frequency: value})}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="monthly">
      <div className="flex items-center gap-2">
        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getFrequencyBadgeColor('monthly'))}>
          Mensal
        </span>
        <span className="text-muted-foreground text-xs">12 metas por ano</span>
      </div>
    </SelectItem>
    {/* ... outras opções ... */}
  </SelectContent>
</Select>
```

### 5. Novo campo "Como calcular a meta?"

```tsx
<Select 
  value={formData.aggregation_type} 
  onValueChange={(value: 'sum' | 'average' | 'max' | 'min' | 'last') => 
    setFormData({...formData, aggregation_type: value})
  }
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sum">Somar todas as metas</SelectItem>
    <SelectItem value="average">Calcular a média das metas</SelectItem>
    <SelectItem value="max">Usar o maior valor entre as metas</SelectItem>
    <SelectItem value="min">Usar o menor valor entre as metas</SelectItem>
    <SelectItem value="last">Usar o último valor registrado</SelectItem>
  </SelectContent>
</Select>
```

### 6. Atualizar payload de criação

Incluir os novos campos no objeto enviado:

```typescript
const resultadoChaveData = {
  // ... campos existentes ...
  target_direction: formData.target_direction,
  aggregation_type: formData.aggregation_type,
  frequency: formData.frequency
};
```

### 7. Reorganizar layout em grid horizontal

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Nome - full width */}
  <div className="space-y-2">...</div>
  
  {/* Dono + Vigência - 2 cols */}
  <div className="grid grid-cols-2 gap-4">...</div>
  
  {/* Direcionamento + Frequência - 2 cols */}
  <div className="grid grid-cols-2 gap-4">...</div>
  
  {/* Meta + Unidade - 2 cols */}
  <div className="grid grid-cols-2 gap-4">...</div>
  
  {/* Como calcular + Peso - 2 cols */}
  <div className="grid grid-cols-2 gap-4">...</div>
  
  {/* Descrição - full width (reduzida) */}
  <div className="space-y-2">
    <Textarea rows={2} />
  </div>
  
  {/* Botões */}
  <div className="flex justify-end gap-3 pt-4 border-t">...</div>
</form>
```

---

## Arquivo a Ser Modificado

| Arquivo | Ação |
|---------|------|
| `src/components/objectives/InlineKeyResultForm.tsx` | Modificar |

---

## Resultado Esperado

O formulário terá:

1. Layout mais horizontal e compacto (cabe em telas menores)
2. Campo "Direcionamento" com visual rico (emoji + descrição)
3. Campo "Frequência das Metas" com badges coloridos + contagem
4. Campo "Como calcular a meta?" como Select (não input numérico)
5. Todos os dados salvos corretamente no banco

