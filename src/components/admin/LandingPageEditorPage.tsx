import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { IconPicker } from './landing-page/IconPicker';
import { ScreenshotManager } from './landing-page/ScreenshotManager';
import { Badge } from '@/components/ui/badge';
import { Eye, RefreshCw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTabEditor } from '@/hooks/useTabEditor';
import { TabControls } from './landing-page/TabControls';
import { EditableField } from './landing-page/EditableField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

export const LandingPageEditorPage: React.FC = () => {
  const { content, loading, updateContent, getContent, refetch, forceRefresh, lastFetch } = useLandingPageContent();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const { toast } = useToast();

  // Tab editors for each section
  const heroEditor = useTabEditor('hero');
  const demoEditor = useTabEditor('demo');
  const benefitsEditor = useTabEditor('benefits');
  const featuresEditor = useTabEditor('features');
  const testimonialsEditor = useTabEditor('testimonials');
  const footerEditor = useTabEditor('footer');

  const handleRefresh = () => {
    forceRefresh();
  };

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Nunca';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  // Legacy save function for sections not yet updated to tab editor
  const handleSave = async (section: string, key: string, value: string, type: 'text' | 'icon' | 'image' = 'text') => {
    setSaving(true);
    const success = await updateContent(section, key, value, type);
    if (success) {
      await refetch();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Editor da Landing Page</h1>
          <p className="text-muted-foreground">Edite todos os textos, imagens e ícones da página inicial</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">Última atualização</div>
            <div className="text-xs text-muted-foreground">
              {formatLastUpdate(lastFetch)}
            </div>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </a>
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Diferença entre elementos:</strong> Os <strong>botões de ação</strong> (Primário/Secundário) são controláveis aqui e aparecem na seção principal. 
          Os <strong>badges de confiança</strong> ("Estratégia", "Crescimento", "Aceleração") são elementos visuais separados que podem ser ativados/desativados independentemente.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Seção Hero</CardTitle>
                <CardDescription>Edite o cabeçalho principal da página</CardDescription>
              </div>
              <TabControls
                isEditing={heroEditor.isEditing}
                hasChanges={heroEditor.hasChanges}
                isSaving={heroEditor.isSaving}
                onStartEdit={heroEditor.startEdit}
                onSave={heroEditor.saveChanges}
                onCancel={heroEditor.cancelEdit}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableField
                id="hero-title"
                label="Título Principal"
                value={heroEditor.getFieldValue('title')}
                isEditing={heroEditor.isEditing}
                placeholder="Título principal da hero section"
                onChange={(value) => heroEditor.updateLocalField('title', value)}
              />

              <EditableField
                id="hero-subtitle"
                label="Subtítulo"
                value={heroEditor.getFieldValue('subtitle')}
                isEditing={heroEditor.isEditing}
                placeholder="Descrição da hero section"
                type="textarea"
                onChange={(value) => heroEditor.updateLocalField('subtitle', value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <EditableField
                  id="primary-button"
                  label="Botão Primário"
                  value={heroEditor.getFieldValue('primary_button')}
                  isEditing={heroEditor.isEditing}
                  placeholder="Texto do botão primário"
                  onChange={(value) => heroEditor.updateLocalField('primary_button', value)}
                />

                <EditableField
                  id="secondary-button"
                  label="Botão Secundário"
                  value={heroEditor.getFieldValue('secondary_button')}
                  isEditing={heroEditor.isEditing}
                  placeholder="Texto do botão secundário"
                  onChange={(value) => heroEditor.updateLocalField('secondary_button', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <EditableField
                  id="primary-button-link"
                  label="Link do Botão Primário"
                  value={heroEditor.getFieldValue('primary_button_link')}
                  isEditing={heroEditor.isEditing}
                  placeholder="/auth ou URL externa"
                  onChange={(value) => heroEditor.updateLocalField('primary_button_link', value)}
                />

                <EditableField
                  id="secondary-button-link"
                  label="Link do Botão Secundário"
                  value={heroEditor.getFieldValue('secondary_button_link')}
                  isEditing={heroEditor.isEditing}
                  placeholder="URL externa ou rota interna"
                  onChange={(value) => heroEditor.updateLocalField('secondary_button_link', value)}
                />
              </div>

              {heroEditor.isEditing ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="space-y-1">
                      <Label htmlFor="primary-button-active" className="text-sm font-medium">
                        Botão Primário Ativo
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mostrar o botão primário na página
                      </p>
                    </div>
                    <Switch
                      id="primary-button-active"
                      checked={heroEditor.getFieldValue('primary_button_active', 'false') === 'true'}
                      onCheckedChange={(checked) => heroEditor.updateLocalField('primary_button_active', checked.toString())}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="space-y-1">
                      <Label htmlFor="secondary-button-active" className="text-sm font-medium">
                        Botão Secundário Ativo
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mostrar o botão secundário na página
                      </p>
                    </div>
                    <Switch
                      id="secondary-button-active"
                      checked={heroEditor.getFieldValue('secondary_button_active', 'false') === 'true'}
                      onCheckedChange={(checked) => heroEditor.updateLocalField('secondary_button_active', checked.toString())}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Botão Primário</Label>
                    <div className="p-3 border rounded-md bg-muted/50 text-sm">
                      {heroEditor.getFieldValue('primary_button_active', 'false') === 'true' ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Botão Secundário</Label>
                    <div className="p-3 border rounded-md bg-muted/50 text-sm">
                      {heroEditor.getFieldValue('secondary_button_active', 'false') === 'true' ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Badges de Confiança</CardTitle>
                <CardDescription>Configure os badges abaixo do hero</CardDescription>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Diferença importante:</strong> Estes badges ("Estratégia", "Crescimento", "Aceleração") são diferentes dos botões de ação. 
                    Os botões de ação ficam logo acima e podem ser o botão primário (verde) ou secundário (azul).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {heroEditor.isEditing && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Mesma sessão de edição
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Trust Badges Ativos</Label>
                  <p className="text-xs text-muted-foreground">
                    Ativar/desativar toda a seção de badges de confiança
                  </p>
                </div>
                {heroEditor.isEditing ? (
                  <Switch
                    checked={heroEditor.getFieldValue('trust_badges_active', 'false') === 'true'}
                    onCheckedChange={(checked) => heroEditor.updateLocalField('trust_badges_active', checked.toString())}
                  />
                ) : (
                  <div className="px-3 py-1 rounded-md bg-muted text-sm">
                    {heroEditor.getFieldValue('trust_badges_active', 'false') === 'true' ? 'Ativo' : 'Inativo'}
                  </div>
                )}
              </div>

              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <EditableField
                      id={`badge_${num}_text`}
                      label={`Badge ${num} - Texto`}
                      value={heroEditor.getFieldValue(`badge_${num}_text`)}
                      isEditing={heroEditor.isEditing}
                      placeholder={`Texto do badge ${num}`}
                      onChange={(value) => heroEditor.updateLocalField(`badge_${num}_text`, value)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">{`Badge ${num === 1 ? 'Estratégia' : num === 2 ? 'Crescimento' : 'Aceleração'}`}</Label>
                        <p className="text-xs text-muted-foreground">
                          Ativar/desativar este badge específico
                        </p>
                      </div>
                      {heroEditor.isEditing ? (
                        <Switch
                          checked={heroEditor.getFieldValue(`badge_${num}_active`, 'false') === 'true'}
                          onCheckedChange={(checked) => heroEditor.updateLocalField(`badge_${num}_active`, checked.toString())}
                        />
                      ) : (
                        <div className="px-3 py-1 rounded-md bg-muted text-sm">
                          {heroEditor.getFieldValue(`badge_${num}_active`, 'false') === 'true' ? 'Ativo' : 'Inativo'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    {heroEditor.isEditing ? (
                      <IconPicker
                        value={heroEditor.getFieldValue(`badge_${num}_icon`)}
                        onChange={(icon) => heroEditor.updateLocalField(`badge_${num}_icon`, icon)}
                      />
                    ) : (
                      <div className="p-3 border rounded-md bg-muted/50 text-sm text-center">
                        {heroEditor.getFieldValue(`badge_${num}_icon`) || 'Nenhum ícone'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 font-medium">
                      {heroEditor.getFieldValue(`badge_${num}_text`, `Badge ${num}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <div className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>Títulos principais da seção</CardDescription>
                </div>
                <TabControls
                  isEditing={featuresEditor.isEditing}
                  hasChanges={featuresEditor.hasChanges}
                  isSaving={featuresEditor.isSaving}
                  onStartEdit={featuresEditor.startEdit}
                  onSave={featuresEditor.saveChanges}
                  onCancel={featuresEditor.cancelEdit}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField
                  id="features-title"
                  label="Título da Seção"
                  value={featuresEditor.getFieldValue('title')}
                  isEditing={featuresEditor.isEditing}
                  onChange={(value) => featuresEditor.updateLocalField('title', value)}
                  placeholder="Ex: Soluções Corporativas COFOUND"
                />
                <EditableField
                  id="features-subtitle"
                  label="Subtítulo da Seção"
                  value={featuresEditor.getFieldValue('subtitle')}
                  isEditing={featuresEditor.isEditing}
                  onChange={(value) => featuresEditor.updateLocalField('subtitle', value)}
                  type="textarea"
                  placeholder="Ex: Impulsione o crescimento da sua empresa..."
                />
              </CardContent>
            </Card>

            {/* Strategy HUB Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Strategy HUB</CardTitle>
                  <CardDescription>Funcionalidades estratégicas empresariais</CardDescription>
                </div>
                {featuresEditor.isEditing && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Mesma sessão de edição
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    id="strategy-hub-title"
                    label="Título do Strategy HUB"
                    value={featuresEditor.getFieldValue('strategy_hub_title')}
                    isEditing={featuresEditor.isEditing}
                    onChange={(value) => featuresEditor.updateLocalField('strategy_hub_title', value)}
                    placeholder="Ex: Strategy HUB"
                  />
                  <EditableField
                    id="strategy-hub-description"
                    label="Descrição do Strategy HUB"
                    value={featuresEditor.getFieldValue('strategy_hub_description')}
                    isEditing={featuresEditor.isEditing}
                    onChange={(value) => featuresEditor.updateLocalField('strategy_hub_description', value)}
                    type="textarea"
                    placeholder="Ex: Ferramentas avançadas para..."
                  />
                </div>

                {/* Strategy Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Features do Strategy HUB</h4>
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="p-4 border rounded-lg space-y-4">
                      <h5 className="font-medium text-sm">Feature {num}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <EditableField
                          id={`strategy-feature-${num}-title`}
                          label="Título"
                          value={featuresEditor.getFieldValue(`strategy_feature_${num}_title`)}
                          isEditing={featuresEditor.isEditing}
                          onChange={(value) => featuresEditor.updateLocalField(`strategy_feature_${num}_title`, value)}
                          placeholder="Ex: Dashboard Executivo"
                        />
                        <EditableField
                          id={`strategy-feature-${num}-description`}
                          label="Descrição"
                          value={featuresEditor.getFieldValue(`strategy_feature_${num}_description`)}
                          isEditing={featuresEditor.isEditing}
                          onChange={(value) => featuresEditor.updateLocalField(`strategy_feature_${num}_description`, value)}
                          type="textarea"
                          placeholder="Ex: Visão centralizada..."
                        />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Ícone</Label>
                          {featuresEditor.isEditing ? (
                            <IconPicker
                              value={featuresEditor.getFieldValue(`strategy_feature_${num}_icon`)}
                              onChange={(icon) => featuresEditor.updateLocalField(`strategy_feature_${num}_icon`, icon)}
                            />
                          ) : (
                            <div className="p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                              {featuresEditor.getFieldValue(`strategy_feature_${num}_icon`) || '(Ícone não definido)'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Startup HUB Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Startup HUB</CardTitle>
                  <CardDescription>Funcionalidades para startups em crescimento</CardDescription>
                </div>
                {featuresEditor.isEditing && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Mesma sessão de edição
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditableField
                    id="startup-hub-title"
                    label="Título do Startup HUB"
                    value={featuresEditor.getFieldValue('startup_hub_title')}
                    isEditing={featuresEditor.isEditing}
                    onChange={(value) => featuresEditor.updateLocalField('startup_hub_title', value)}
                    placeholder="Ex: Startup HUB"
                  />
                  <EditableField
                    id="startup-hub-description"
                    label="Descrição do Startup HUB"
                    value={featuresEditor.getFieldValue('startup_hub_description')}
                    isEditing={featuresEditor.isEditing}
                    onChange={(value) => featuresEditor.updateLocalField('startup_hub_description', value)}
                    type="textarea"
                    placeholder="Ex: Ecossistema completo para..."
                  />
                </div>

                {/* Startup Features */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Features do Startup HUB</h4>
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="p-4 border rounded-lg space-y-4">
                      <h5 className="font-medium text-sm">Feature {num}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <EditableField
                          id={`startup-feature-${num}-title`}
                          label="Título"
                          value={featuresEditor.getFieldValue(`startup_feature_${num}_title`)}
                          isEditing={featuresEditor.isEditing}
                          onChange={(value) => featuresEditor.updateLocalField(`startup_feature_${num}_title`, value)}
                          placeholder="Ex: Analytics BEEP"
                        />
                        <EditableField
                          id={`startup-feature-${num}-description`}
                          label="Descrição"
                          value={featuresEditor.getFieldValue(`startup_feature_${num}_description`)}
                          isEditing={featuresEditor.isEditing}
                          onChange={(value) => featuresEditor.updateLocalField(`startup_feature_${num}_description`, value)}
                          type="textarea"
                          placeholder="Ex: Análise avançada..."
                        />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Ícone</Label>
                          {featuresEditor.isEditing ? (
                            <IconPicker
                              value={featuresEditor.getFieldValue(`startup_feature_${num}_icon`)}
                              onChange={(icon) => featuresEditor.updateLocalField(`startup_feature_${num}_icon`, icon)}
                            />
                          ) : (
                            <div className="p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                              {featuresEditor.getFieldValue(`startup_feature_${num}_icon`) || '(Ícone não definido)'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demo">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Seção Demo - Configurações Gerais</CardTitle>
                  <CardDescription>Configure o título e subtítulo da seção "Veja o Start Together em Ação"</CardDescription>
                </div>
                <TabControls
                  isEditing={demoEditor.isEditing}
                  hasChanges={demoEditor.hasChanges}
                  isSaving={demoEditor.isSaving}
                  onStartEdit={demoEditor.startEdit}
                  onSave={demoEditor.saveChanges}
                  onCancel={demoEditor.cancelEdit}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField
                  id="demo-title"
                  label="Título da Seção"
                  value={demoEditor.getFieldValue('title')}
                  isEditing={demoEditor.isEditing}
                  placeholder="Título principal da seção demo"
                  onChange={(value) => demoEditor.updateLocalField('title', value)}
                />

                <EditableField
                  id="demo-subtitle"
                  label="Subtítulo da Seção"
                  value={demoEditor.getFieldValue('subtitle')}
                  isEditing={demoEditor.isEditing}
                  placeholder="Subtítulo da seção demo"
                  onChange={(value) => demoEditor.updateLocalField('subtitle', value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Screenshots do Carousel</CardTitle>
                  <CardDescription>Gerencie as imagens e informações dos 8 screenshots do carousel</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {demoEditor.isEditing && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Mesma sessão de edição
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <ScreenshotManager
                      key={num}
                      screenshotNumber={num}
                      title={demoEditor.isEditing ? 
                        demoEditor.getFieldValue(`screenshot_${num}_title`, '') : 
                        getContent('demo', `screenshot_${num}_title`, '')}
                      description={demoEditor.isEditing ? 
                        demoEditor.getFieldValue(`screenshot_${num}_description`, '') : 
                        getContent('demo', `screenshot_${num}_description`, '')}
                      module={demoEditor.isEditing ? 
                        demoEditor.getFieldValue(`screenshot_${num}_module`, 'Strategy HUB') : 
                        getContent('demo', `screenshot_${num}_module`, 'Strategy HUB')}
                      imageUrl={getContent('demo', `screenshot_${num}_image`, '')}
                      isEditing={demoEditor.isEditing}
                      onTitleChange={(value) => demoEditor.isEditing ? 
                        demoEditor.updateLocalField(`screenshot_${num}_title`, value) : 
                        handleSave('demo', `screenshot_${num}_title`, value)}
                      onDescriptionChange={(value) => demoEditor.isEditing ? 
                        demoEditor.updateLocalField(`screenshot_${num}_description`, value) : 
                        handleSave('demo', `screenshot_${num}_description`, value)}
                      onModuleChange={(value) => demoEditor.isEditing ? 
                        demoEditor.updateLocalField(`screenshot_${num}_module`, value) : 
                        handleSave('demo', `screenshot_${num}_module`, value)}
                      onImageChange={(url) => {
                        if (demoEditor.isEditing) {
                          demoEditor.updateLocalField(`screenshot_${num}_image`, url);
                        }
                        handleSave('demo', `screenshot_${num}_image`, url);
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benefits">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Seção Benefits - Configurações Gerais</CardTitle>
                  <CardDescription>Configure o título e subtítulo da seção "Resultados Comprovados"</CardDescription>
                </div>
                <TabControls
                  isEditing={benefitsEditor.isEditing}
                  hasChanges={benefitsEditor.hasChanges}
                  isSaving={benefitsEditor.isSaving}
                  onStartEdit={benefitsEditor.startEdit}
                  onSave={benefitsEditor.saveChanges}
                  onCancel={benefitsEditor.cancelEdit}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField
                  id="benefits-title"
                  label="Título da Seção"
                  value={benefitsEditor.getFieldValue('title')}
                  isEditing={benefitsEditor.isEditing}
                  placeholder="Título principal da seção benefits"
                  onChange={(value) => benefitsEditor.updateLocalField('title', value)}
                />

                <EditableField
                  id="benefits-subtitle"
                  label="Subtítulo da Seção"
                  value={benefitsEditor.getFieldValue('subtitle')}
                  isEditing={benefitsEditor.isEditing}
                  placeholder="Subtítulo da seção benefits"
                  onChange={(value) => benefitsEditor.updateLocalField('subtitle', value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Métricas de Resultados</CardTitle>
                  <CardDescription>Configure as 4 métricas principais que demonstram os resultados da plataforma</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {benefitsEditor.isEditing && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Mesma sessão de edição
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Card key={num} className="p-4">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Métrica {num}</h4>
                        
                        <EditableField
                          id={`metric_${num}_value`}
                          label="Valor da Métrica"
                          value={benefitsEditor.getFieldValue(`metric_${num}_value`)}
                          isEditing={benefitsEditor.isEditing}
                          placeholder="90%, 75%, 200+, 300%"
                          onChange={(value) => benefitsEditor.updateLocalField(`metric_${num}_value`, value)}
                        />

                        <EditableField
                          id={`metric_${num}_description`}
                          label="Descrição da Métrica"
                          value={benefitsEditor.getFieldValue(`metric_${num}_description`)}
                          isEditing={benefitsEditor.isEditing}
                          placeholder="Descrição do resultado alcançado"
                          type="textarea"
                          rows={2}
                          onChange={(value) => benefitsEditor.updateLocalField(`metric_${num}_description`, value)}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testimonials">
          <div className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>Títulos principais da seção de depoimentos</CardDescription>
                </div>
                <TabControls
                  isEditing={testimonialsEditor.isEditing}
                  hasChanges={testimonialsEditor.hasChanges}
                  isSaving={testimonialsEditor.isSaving}
                  onStartEdit={testimonialsEditor.startEdit}
                  onSave={testimonialsEditor.saveChanges}
                  onCancel={testimonialsEditor.cancelEdit}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField
                  id="testimonials-title"
                  label="Título da Seção"
                  value={testimonialsEditor.getFieldValue('title')}
                  isEditing={testimonialsEditor.isEditing}
                  onChange={(value) => testimonialsEditor.updateLocalField('title', value)}
                  placeholder="Ex: Depoimentos de Clientes"
                />
                <EditableField
                  id="testimonials-subtitle"
                  label="Subtítulo da Seção"
                  value={testimonialsEditor.getFieldValue('subtitle')}
                  isEditing={testimonialsEditor.isEditing}
                  onChange={(value) => testimonialsEditor.updateLocalField('subtitle', value)}
                  type="textarea"
                  placeholder="Ex: Veja o que nossos clientes falam..."
                />
              </CardContent>
            </Card>

            {/* Testimonials */}
            {[1, 2, 3].map((num) => (
              <Card key={num}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Depoimento {num}</CardTitle>
                    <CardDescription>Cliente {testimonialsEditor.getFieldValue(`testimonial_${num}_name`) || `#${num}`}</CardDescription>
                  </div>
                  {testimonialsEditor.isEditing && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Mesma sessão de edição
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <EditableField
                      id={`testimonial-${num}-name`}
                      label="Nome do Cliente"
                      value={testimonialsEditor.getFieldValue(`testimonial_${num}_name`)}
                      isEditing={testimonialsEditor.isEditing}
                      onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_name`, value)}
                      placeholder="Ex: Carolina Mendes"
                    />
                    <EditableField
                      id={`testimonial-${num}-position`}
                      label="Cargo"
                      value={testimonialsEditor.getFieldValue(`testimonial_${num}_position`)}
                      isEditing={testimonialsEditor.isEditing}
                      onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_position`, value)}
                      placeholder="Ex: CEO"
                    />
                    <EditableField
                      id={`testimonial-${num}-company`}
                      label="Empresa"
                      value={testimonialsEditor.getFieldValue(`testimonial_${num}_company`)}
                      isEditing={testimonialsEditor.isEditing}
                      onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_company`, value)}
                      placeholder="Ex: TechStart Brasil"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <EditableField
                      id={`testimonial-${num}-badge-type`}
                      label="Tipo do Badge"
                      value={testimonialsEditor.getFieldValue(`testimonial_${num}_badge_type`)}
                      isEditing={testimonialsEditor.isEditing}
                      onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_badge_type`, value)}
                      placeholder="Ex: Startup HUB"
                    />
                    <EditableField
                      id={`testimonial-${num}-badge-color`}
                      label="Cor do Badge"
                      value={testimonialsEditor.getFieldValue(`testimonial_${num}_badge_color`)}
                      isEditing={testimonialsEditor.isEditing}
                      onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_badge_color`, value)}
                      placeholder="Ex: accent, primary"
                    />
                    <EditableField
                      id={`testimonial-${num}-rating`}
                      label="Avaliação (1-5)"
                      value={testimonialsEditor.getFieldValue(`testimonial_${num}_rating`)}
                      isEditing={testimonialsEditor.isEditing}
                      onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_rating`, value)}
                      placeholder="Ex: 5"
                    />
                  </div>

                  <EditableField
                    id={`testimonial-${num}-testimonial`}
                    label="Depoimento"
                    value={testimonialsEditor.getFieldValue(`testimonial_${num}_testimonial`)}
                    isEditing={testimonialsEditor.isEditing}
                    onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_testimonial`, value)}
                    type="textarea"
                    rows={4}
                    placeholder="Ex: O Startup HUB foi fundamental para..."
                  />

                  <EditableField
                    id={`testimonial-${num}-avatar-url`}
                    label="URL do Avatar (opcional)"
                    value={testimonialsEditor.getFieldValue(`testimonial_${num}_avatar_url`)}
                    isEditing={testimonialsEditor.isEditing}
                    onChange={(value) => testimonialsEditor.updateLocalField(`testimonial_${num}_avatar_url`, value)}
                    placeholder="Ex: https://example.com/avatar.jpg"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="footer">
          <div className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Informações da Empresa</CardTitle>
                  <CardDescription>Nome e descrição principal no rodapé</CardDescription>
                </div>
                <TabControls
                  isEditing={footerEditor.isEditing}
                  hasChanges={footerEditor.hasChanges}
                  isSaving={footerEditor.isSaving}
                  onStartEdit={footerEditor.startEdit}
                  onSave={footerEditor.saveChanges}
                  onCancel={footerEditor.cancelEdit}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField
                  id="footer-company-name"
                  label="Nome da Empresa"
                  value={footerEditor.getFieldValue('company_name')}
                  isEditing={footerEditor.isEditing}
                  onChange={(value) => footerEditor.updateLocalField('company_name', value)}
                  placeholder="Ex: Start Together"
                />
                <EditableField
                  id="footer-company-description"
                  label="Descrição da Empresa"
                  value={footerEditor.getFieldValue('company_description')}
                  isEditing={footerEditor.isEditing}
                  onChange={(value) => footerEditor.updateLocalField('company_description', value)}
                  type="textarea"
                  rows={4}
                  placeholder="Ex: Plataforma completa de gestão estratégica..."
                />
              </CardContent>
            </Card>

            {/* Footer Links Columns */}
            {[1, 2, 3].map((columnNum) => (
              <Card key={columnNum}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Coluna {columnNum}</CardTitle>
                    <CardDescription>{footerEditor.getFieldValue(`column_${columnNum}_title`) || `Coluna de links ${columnNum}`}</CardDescription>
                  </div>
                  {footerEditor.isEditing && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Mesma sessão de edição
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableField
                    id={`footer-column-${columnNum}-title`}
                    label="Título da Coluna"
                    value={footerEditor.getFieldValue(`column_${columnNum}_title`)}
                    isEditing={footerEditor.isEditing}
                    onChange={(value) => footerEditor.updateLocalField(`column_${columnNum}_title`, value)}
                    placeholder={`Ex: ${columnNum === 1 ? 'Funcionalidades' : columnNum === 2 ? 'Empresa' : 'Suporte'}`}
                  />

                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Links da Coluna {columnNum}</h4>
                    {[1, 2, 3, 4].map((linkNum) => (
                      <div key={linkNum} className="p-4 border rounded-lg">
                        <h5 className="font-medium text-sm mb-4">Link {linkNum}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <EditableField
                            id={`footer-column-${columnNum}-link-${linkNum}-text`}
                            label="Texto do Link"
                            value={footerEditor.getFieldValue(`column_${columnNum}_link_${linkNum}_text`)}
                            isEditing={footerEditor.isEditing}
                            onChange={(value) => footerEditor.updateLocalField(`column_${columnNum}_link_${linkNum}_text`, value)}
                            placeholder="Ex: Strategy HUB"
                          />
                          <EditableField
                            id={`footer-column-${columnNum}-link-${linkNum}-url`}
                            label="URL do Link"
                            value={footerEditor.getFieldValue(`column_${columnNum}_link_${linkNum}_url`)}
                            isEditing={footerEditor.isEditing}
                            onChange={(value) => footerEditor.updateLocalField(`column_${columnNum}_link_${linkNum}_url`, value)}
                            placeholder="Ex: /strategy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Legal Links & Copyright */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Links Legais & Copyright</CardTitle>
                  <CardDescription>Rodapé inferior com links legais</CardDescription>
                </div>
                {footerEditor.isEditing && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Mesma sessão de edição
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableField
                  id="footer-copyright-text"
                  label="Texto de Copyright"
                  value={footerEditor.getFieldValue('copyright_text')}
                  isEditing={footerEditor.isEditing}
                  onChange={(value) => footerEditor.updateLocalField('copyright_text', value)}
                  placeholder="Ex: © 2024 Start Together. Todos os direitos reservados."
                />

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Links Legais</h4>
                  {[1, 2, 3].map((linkNum) => (
                    <div key={linkNum} className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-4">Link Legal {linkNum}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditableField
                          id={`footer-legal-link-${linkNum}-text`}
                          label="Texto do Link"
                          value={footerEditor.getFieldValue(`legal_link_${linkNum}_text`)}
                          isEditing={footerEditor.isEditing}
                          onChange={(value) => footerEditor.updateLocalField(`legal_link_${linkNum}_text`, value)}
                          placeholder={`Ex: ${linkNum === 1 ? 'Termos de Uso' : linkNum === 2 ? 'Política de Privacidade' : 'Cookies'}`}
                        />
                        <EditableField
                          id={`footer-legal-link-${linkNum}-url`}
                          label="URL do Link"
                          value={footerEditor.getFieldValue(`legal_link_${linkNum}_url`)}
                          isEditing={footerEditor.isEditing}
                          onChange={(value) => footerEditor.updateLocalField(`legal_link_${linkNum}_url`, value)}
                          placeholder={`Ex: /${linkNum === 1 ? 'terms' : linkNum === 2 ? 'privacy' : 'cookies'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <EditableField
                  id="footer-cofound-text"
                  label="Texto COFOUND"
                  value={footerEditor.getFieldValue('cofound_text')}
                  isEditing={footerEditor.isEditing}
                  onChange={(value) => footerEditor.updateLocalField('cofound_text', value)}
                  placeholder="Ex: Desenvolvido por COFOUND"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-4 right-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Salvando...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};