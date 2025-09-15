import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAISettings, AISettings } from '@/hooks/useAISettings';
import { Brain, Mic, Settings, Zap, Globe, User } from 'lucide-react';

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido)', description: 'Modelo rápido e eficiente' },
  { value: 'gpt-4o', label: 'GPT-4o (Equilibrado)', description: 'Melhor relação custo-benefício' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Avançado)', description: 'Mais poderoso para tarefas complexas' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Econômico)', description: 'Opção mais econômica' },
];

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy', description: 'Voz neutra e profissional' },
  { value: 'echo', label: 'Echo', description: 'Voz masculina e clara' },
  { value: 'fable', label: 'Fable', description: 'Voz feminina e suave' },
  { value: 'onyx', label: 'Onyx', description: 'Voz masculina e grave' },
  { value: 'nova', label: 'Nova', description: 'Voz feminina e energética' },
  { value: 'shimmer', label: 'Shimmer', description: 'Voz feminina e doce' },
];

const AGENT_PROFILES = [
  { value: 'assistant', label: 'Assistente Geral', description: 'Assistente profissional para tarefas gerais' },
  { value: 'analyst', label: 'Analista Estratégico', description: 'Especialista em análise de dados e estratégia' },
  { value: 'coach', label: 'Coach Executivo', description: 'Orientação e desenvolvimento profissional' },
  { value: 'consultant', label: 'Consultor de Negócios', description: 'Especialista em gestão e processos' },
];

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ open, onOpenChange }) => {
  const { settings, loading, saving, saveSettings } = useAISettings();
  const [formData, setFormData] = useState<Partial<AISettings>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings(formData);
    onOpenChange(false);
  };

  const updateField = (field: keyof AISettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações da IA
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="model" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="model" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Modelo
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Comportamento
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Voz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Modelo</CardTitle>
                <CardDescription>
                  Configure o modelo de IA e parâmetros de geração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Modelo de IA</Label>
                  <Select 
                    value={formData.model} 
                    onValueChange={(value) => updateField('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div>
                            <div className="font-medium">{model.label}</div>
                            <div className="text-sm text-muted-foreground">{model.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperatura ({formData.temperature})</Label>
                    <div className="px-3">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Preciso</span>
                        <span>Criativo</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Máximo de Tokens</Label>
                    <Input
                      type="number"
                      min="100"
                      max="4000"
                      value={formData.max_tokens}
                      onChange={(e) => updateField('max_tokens', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil do Agente</CardTitle>
                <CardDescription>
                  Defina a personalidade e especialização da IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Perfil do Agente</Label>
                  <Select 
                    value={formData.agent_profile} 
                    onValueChange={(value) => updateField('agent_profile', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_PROFILES.map((profile) => (
                        <SelectItem key={profile.value} value={profile.value}>
                          <div>
                            <div className="font-medium">{profile.label}</div>
                            <div className="text-sm text-muted-foreground">{profile.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prompt do Sistema</Label>
                  <Textarea
                    placeholder="Digite as instruções específicas para a IA..."
                    value={formData.system_prompt}
                    onChange={(e) => updateField('system_prompt', e.target.value)}
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Este prompt define como a IA deve se comportar e responder às perguntas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recursos Avançados</CardTitle>
                <CardDescription>
                  Configure recursos adicionais da IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Consulta na Web</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que a IA busque informações atualizadas na internet
                    </p>
                  </div>
                  <Switch
                    checked={formData.web_search_enabled}
                    onCheckedChange={(checked) => updateField('web_search_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium">Recursos Futuros</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mais recursos como integração com APIs externas, análise de documentos e 
                    processamento de imagens serão adicionados em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Voz</CardTitle>
                <CardDescription>
                  Configure a síntese de voz da IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar Voz</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que a IA responda com áudio
                    </p>
                  </div>
                  <Switch
                    checked={formData.voice_enabled}
                    onCheckedChange={(checked) => updateField('voice_enabled', checked)}
                  />
                </div>

                {formData.voice_enabled && (
                  <>
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Modelo de Voz</Label>
                        <Select 
                          value={formData.voice_model} 
                          onValueChange={(value) => updateField('voice_model', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tts-1">TTS-1 (Rápido)</SelectItem>
                            <SelectItem value="tts-1-hd">TTS-1 HD (Alta Qualidade)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Voz</Label>
                        <Select 
                          value={formData.voice_id} 
                          onValueChange={(value) => updateField('voice_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_OPTIONS.map((voice) => (
                              <SelectItem key={voice.value} value={voice.value}>
                                <div>
                                  <div className="font-medium">{voice.label}</div>
                                  <div className="text-sm text-muted-foreground">{voice.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};