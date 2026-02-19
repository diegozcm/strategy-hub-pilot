import { useState, useRef } from "react";
import { Building2, Sparkles, Target, Eye, Heart, Upload, Loader2 } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function NewCompanyPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "regular" as "regular" | "startup",
    mission: "",
    vision: "",
    values: "",
    aiEnabled: false,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreateCompany = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da empresa.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const valuesArray = formData.values
        ? formData.values.split(",").map(v => v.trim()).filter(Boolean)
        : null;

      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          name: formData.name.trim(),
          company_type: formData.type,
          mission: formData.mission.trim() || null,
          vision: formData.vision.trim() || null,
          values: valuesArray,
          ai_enabled: formData.aiEnabled,
          owner_id: user.id,
          status: "active",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Upload logo if selected
      if (logoFile && company) {
        const ext = logoFile.name.split(".").pop();
        const filePath = `${company.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("company-logos")
            .getPublicUrl(filePath);

          await supabase
            .from("companies")
            .update({ logo_url: urlData.publicUrl })
            .eq("id", company.id);
        }
      }

      toast({ title: "Empresa criada!", description: `"${formData.name}" foi cadastrada com sucesso.` });
      navigate("/app/admin/companies");
    } catch (err: any) {
      toast({ title: "Erro ao criar empresa", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminPageContainer 
      title="Nova Empresa" 
      description="Cadastre uma nova empresa no sistema"
    >
      <div className="max-w-3xl space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Dados principais da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                placeholder="Ex: Empresa Exemplo Ltda"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Empresa *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: "regular" | "startup") => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Empresa Regular</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={logoPreview} alt="Preview" />
                      <AvatarFallback>{formData.name.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">{logoFile?.name}</p>
                    <Button variant="outline" size="sm" onClick={() => { setLogoFile(null); setLogoPreview(null); }}>
                      Remover
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecionar Arquivo
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identidade Corporativa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Identidade Corporativa
            </CardTitle>
            <CardDescription>Missão, visão e valores da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mission" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Missão
              </Label>
              <Textarea
                id="mission"
                placeholder="Qual é a razão de existir da empresa?"
                value={formData.mission}
                onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vision" className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Visão
              </Label>
              <Textarea
                id="vision"
                placeholder="Onde a empresa quer chegar?"
                value={formData.vision}
                onChange={(e) => setFormData(prev => ({ ...prev, vision: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="values" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                Valores
              </Label>
              <Textarea
                id="values"
                placeholder="Quais são os valores fundamentais? (separe por vírgula)"
                value={formData.values}
                onChange={(e) => setFormData(prev => ({ ...prev, values: e.target.value }))}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Recursos Avançados
            </CardTitle>
            <CardDescription>Configure recursos opcionais para a empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="ai-enabled" className="text-base">Habilitar IA Copilot</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que usuários da empresa usem o assistente de IA
                </p>
              </div>
              <Switch
                id="ai-enabled"
                checked={formData.aiEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, aiEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate("/app/admin/companies")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreateCompany} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? "Criando..." : "Criar Empresa"}
          </Button>
        </div>
      </div>
    </AdminPageContainer>
  );
}
