import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageCropUpload } from "@/components/ui/ImageCropUpload";
import { Building2, Settings, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyWithDetails {
  id: string;
  name: string;
  logo_url?: string | null;
  status?: string | null;
  company_type?: string | null;
  ai_enabled?: boolean;
  mission?: string | null;
  vision?: string | null;
  values?: string[] | null;
}

interface EditCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithDetails | null;
  onSuccess: () => void;
}

export function EditCompanyModal({ 
  open, 
  onOpenChange, 
  company,
  onSuccess 
}: EditCompanyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mission: "",
    vision: "",
    values: [] as string[],
    logo_url: null as string | null,
    company_type: "regular" as "regular" | "startup",
    ai_enabled: false,
  });
  const [newValue, setNewValue] = useState("");

  // Load full company data when modal opens
  useEffect(() => {
    if (open && company) {
      loadCompanyDetails();
    }
  }, [open, company?.id]);

  const loadCompanyDetails = async () => {
    if (!company) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, mission, vision, values, logo_url, company_type, ai_enabled')
        .eq('id', company.id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        mission: data.mission || "",
        vision: data.vision || "",
        values: data.values || [],
        logo_url: data.logo_url,
        company_type: (data.company_type as "regular" | "startup") || "regular",
        ai_enabled: data.ai_enabled || false,
      });
    } catch (error) {
      console.error('Error loading company details:', error);
    }
  };

  const handleAddValue = () => {
    if (newValue.trim() && !formData.values.includes(newValue.trim())) {
      setFormData({
        ...formData,
        values: [...formData.values, newValue.trim()]
      });
      setNewValue("");
    }
  };

  const handleRemoveValue = (index: number) => {
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!company) return;

    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da empresa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.name.trim(),
          mission: formData.mission || null,
          vision: formData.vision || null,
          values: formData.values.length > 0 ? formData.values : null,
          logo_url: formData.logo_url,
          company_type: formData.company_type,
          ai_enabled: formData.ai_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Empresa atualizada",
        description: "As informações foram salvas com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Empresa
          </DialogTitle>
          <DialogDescription>
            Atualize as informações e configurações da empresa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações Gerais */}
          <TabsContent value="general" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>

            <ImageCropUpload
              currentImageUrl={formData.logo_url}
              onImageUploaded={(url) => setFormData({ ...formData, logo_url: url })}
              disabled={loading}
              aspectRatio={1}
              companyId={company.id}
            />

            <div className="space-y-2">
              <Label htmlFor="mission">Missão</Label>
              <Textarea
                id="mission"
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Descreva a missão da empresa"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vision">Visão</Label>
              <Textarea
                id="vision"
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                placeholder="Descreva a visão da empresa"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Valores</Label>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Adicionar valor"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue())}
                />
                <Button type="button" onClick={handleAddValue} variant="secondary">
                  Adicionar
                </Button>
              </div>
              {formData.values.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {value}
                      <button
                        onClick={() => handleRemoveValue(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Configurações */}
          <TabsContent value="settings" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="company_type">Tipo de Empresa</Label>
              <Select
                value={formData.company_type}
                onValueChange={(value: "regular" | "startup") => setFormData({ ...formData, company_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="ai-enabled">AI Copilot</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita o assistente de IA para os usuários desta empresa
                </p>
              </div>
              <Switch
                id="ai-enabled"
                checked={formData.ai_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, ai_enabled: checked })
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
