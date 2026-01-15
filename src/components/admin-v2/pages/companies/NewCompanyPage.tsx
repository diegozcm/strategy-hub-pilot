import { useState } from "react";
import { Building2, Sparkles, Target, Eye, Heart, Upload } from "lucide-react";
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

export default function NewCompanyPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    type: "regular",
    mission: "",
    vision: "",
    values: "",
    aiEnabled: false,
  });

  const handleNotImplemented = (action: string) => {
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: `A ação "${action}" será implementada em breve.`,
    });
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
            <CardDescription>
              Dados principais da empresa
            </CardDescription>
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
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
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arraste uma imagem ou clique para selecionar
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleNotImplemented("Upload de logo")}
                >
                  Selecionar Arquivo
                </Button>
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
            <CardDescription>
              Missão, visão e valores da empresa
            </CardDescription>
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
            <CardDescription>
              Configure recursos opcionais para a empresa
            </CardDescription>
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
            onClick={() => navigate("/app/admin-v2/companies/all")}
          >
            Cancelar
          </Button>
          <Button onClick={() => handleNotImplemented("Criar Empresa")}>
            <Building2 className="h-4 w-4 mr-2" />
            Criar Empresa
          </Button>
        </div>
      </div>
    </AdminPageContainer>
  );
}
