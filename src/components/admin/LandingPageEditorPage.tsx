import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { IconPicker } from './landing-page/IconPicker';
import { ScreenshotManager } from './landing-page/ScreenshotManager';
import { ImageUploader } from './landing-page/ImageUploader';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, RefreshCw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTabEditor } from '@/hooks/useTabEditor';
import { TabControls } from './landing-page/TabControls';
import { EditableField } from './landing-page/EditableField';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const LandingPageEditorPage: React.FC = () => {
  const { content, loading, updateContent, getContent, refetch, forceRefresh, lastFetch } = useLandingPageContent();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Tab editors for each section
  const heroEditor = useTabEditor('hero');

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

      <Tabs defaultValue="hero" className="w-full">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="primary-button-active"
                      checked={heroEditor.getFieldValue('primary_button_active', 'false') === 'true'}
                      onChange={(e) => heroEditor.updateLocalField('primary_button_active', e.target.checked.toString())}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <Label htmlFor="primary-button-active">Mostrar Botão Primário</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="secondary-button-active"
                      checked={heroEditor.getFieldValue('secondary_button_active', 'false') === 'true'}
                      onChange={(e) => heroEditor.updateLocalField('secondary_button_active', e.target.checked.toString())}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <Label htmlFor="secondary-button-active">Mostrar Botão Secundário</Label>
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
              <EditableField
                id="trust_badges_active"
                label="Ativar Trust Badges"
                value={heroEditor.getFieldValue('trust_badges_active')}
                isEditing={heroEditor.isEditing}
                placeholder="true/false"
                onChange={(value) => heroEditor.updateLocalField('trust_badges_active', value)}
              />

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
                    <EditableField
                      id={`badge_${num}_active`}
                      label={`Badge ${num} - Ativo`}
                      value={heroEditor.getFieldValue(`badge_${num}_active`)}
                      isEditing={heroEditor.isEditing}
                      placeholder="true/false"
                      onChange={(value) => heroEditor.updateLocalField(`badge_${num}_active`, value)}
                    />
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
            <CardHeader>
              <CardTitle>Seção Features</CardTitle>
              <CardDescription>Em desenvolvimento - adicione conteúdo das features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seção Demo - Configurações Gerais</CardTitle>
                <CardDescription>Configure o título e subtítulo da seção "Veja o Start Together em Ação"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="demo_title">Título da Seção</Label>
                  <Input
                    id="demo_title"
                    value={getContent('demo', 'title', '')}
                    onChange={(e) => handleSave('demo', 'title', e.target.value)}
                    placeholder="Título principal da seção demo"
                  />
                </div>
                <div>
                  <Label htmlFor="demo_subtitle">Subtítulo da Seção</Label>
                  <Input
                    id="demo_subtitle"
                    value={getContent('demo', 'subtitle', '')}
                    onChange={(e) => handleSave('demo', 'subtitle', e.target.value)}
                    placeholder="Subtítulo da seção demo"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Screenshots do Carousel</CardTitle>
                <CardDescription>Gerencie as imagens e informações dos 8 screenshots do carousel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <ScreenshotManager
                      key={num}
                      screenshotNumber={num}
                      title={getContent('demo', `screenshot_${num}_title`, '')}
                      description={getContent('demo', `screenshot_${num}_description`, '')}
                      module={getContent('demo', `screenshot_${num}_module`, 'Strategy HUB')}
                      imageUrl={getContent('demo', `screenshot_${num}_image`, '')}
                      onTitleChange={(value) => handleSave('demo', `screenshot_${num}_title`, value)}
                      onDescriptionChange={(value) => handleSave('demo', `screenshot_${num}_description`, value)}
                      onModuleChange={(value) => handleSave('demo', `screenshot_${num}_module`, value)}
                      onImageChange={(url) => handleSave('demo', `screenshot_${num}_image`, url)}
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
              <CardHeader>
                <CardTitle>Seção Benefits - Configurações Gerais</CardTitle>
                <CardDescription>Configure o título e subtítulo da seção "Resultados Comprovados"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="benefits_title">Título da Seção</Label>
                  <Input
                    id="benefits_title"
                    value={getContent('benefits', 'title', '')}
                    onChange={(e) => handleSave('benefits', 'title', e.target.value)}
                    placeholder="Título principal da seção benefits"
                  />
                </div>
                <div>
                  <Label htmlFor="benefits_subtitle">Subtítulo da Seção</Label>
                  <Input
                    id="benefits_subtitle"
                    value={getContent('benefits', 'subtitle', '')}
                    onChange={(e) => handleSave('benefits', 'subtitle', e.target.value)}
                    placeholder="Subtítulo da seção benefits"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Resultados</CardTitle>
                <CardDescription>Configure as 4 métricas principais que demonstram os resultados da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Card key={num} className="p-4">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Métrica {num}</h4>
                        <div>
                          <Label htmlFor={`metric_${num}_value`}>Valor da Métrica</Label>
                          <Input
                            id={`metric_${num}_value`}
                            value={getContent('benefits', `metric_${num}_value`, '')}
                            onChange={(e) => handleSave('benefits', `metric_${num}_value`, e.target.value)}
                            placeholder="90%, 75%, 200+, 300%"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`metric_${num}_description`}>Descrição da Métrica</Label>
                          <Textarea
                            id={`metric_${num}_description`}
                            value={getContent('benefits', `metric_${num}_description`, '')}
                            onChange={(e) => handleSave('benefits', `metric_${num}_description`, e.target.value)}
                            placeholder="Descrição do resultado alcançado"
                            rows={2}
                          />
                        </div>
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
            <CardHeader>
              <CardTitle>Seção Testimonials</CardTitle>
              <CardDescription>Em desenvolvimento - gerencie depoimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>Em desenvolvimento - edite links e textos do rodapé</CardDescription>
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