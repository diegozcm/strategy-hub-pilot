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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Seção Features</CardTitle>
                <CardDescription>Em desenvolvimento - adicione conteúdo das features</CardDescription>
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
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Seção Testimonials</CardTitle>
                <CardDescription>Em desenvolvimento - gerencie depoimentos</CardDescription>
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
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Footer</CardTitle>
                <CardDescription>Em desenvolvimento - edite links e textos do rodapé</CardDescription>
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
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
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