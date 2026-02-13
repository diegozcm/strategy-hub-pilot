import { useState, useEffect, useRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, Save } from 'lucide-react';
import { KeyResult } from '@/types/strategic-map';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KRPropertiesPopoverProps {
  keyResult: KeyResult;
  onSave: () => void;
}

export const KRPropertiesPopover = ({ keyResult, onSave }: KRPropertiesPopoverProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState('');

  // Only initialize when popover opens
  useEffect(() => {
    if (!open) return;
    const val = keyResult.variation_threshold;
    if (val !== null && val !== undefined) {
      setEnabled(true);
      setThreshold(String(val));
    } else {
      setEnabled(false);
      setThreshold('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = enabled ? parseFloat(threshold) : null;
      
      if (enabled && (isNaN(value!) || value! <= 0)) {
        toast({ title: 'Erro', description: 'Informe um percentual válido maior que zero.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('key_results')
        .update({ variation_threshold: value } as any)
        .eq('id', keyResult.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Propriedades salvas com sucesso!' });
      setOpen(false);
      onSave();
    } catch (error) {
      console.error('Erro ao salvar propriedades:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar as propriedades.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-100 hover:border-orange-300 hover:text-orange-600"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Propriedades
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        className="w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md z-[99999] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        align="start"
        sideOffset={5}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Propriedades do KR</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Configure regras de validação para atualização de valores.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="variation-toggle" className="text-sm font-medium cursor-pointer">
                Taxa de Variação
              </Label>
              <Switch
                id="variation-toggle"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {enabled && (
              <div className="space-y-2 pl-0">
                <Label htmlFor="threshold-input" className="text-xs text-muted-foreground">
                  Percentual máximo de variação permitido
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="threshold-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="15"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se a variação entre o último valor e o novo valor ultrapassar esse limite, 
                  será obrigatório criar um FCA antes de salvar.
                </p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving} 
            size="sm" 
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Propriedades'}
          </Button>
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
