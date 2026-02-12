import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

  useEffect(() => {
    const val = keyResult.variation_threshold;
    if (val !== null && val !== undefined) {
      setEnabled(true);
      setThreshold(String(val));
    } else {
      setEnabled(false);
      setThreshold('');
    }
  }, [keyResult.variation_threshold, open]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-100 hover:border-orange-300 hover:text-orange-600"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Propriedades
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
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
      </PopoverContent>
    </Popover>
  );
};
