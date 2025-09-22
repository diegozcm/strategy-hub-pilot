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
import { Save, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LandingPageEditorPage: React.FC = () => {
  const { content, loading, updateContent, getContent, refetch } = useLandingPageContent();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
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
            <CardHeader>
              <CardTitle>Seção Hero</CardTitle>
              <CardDescription>Edite o cabeçalho principal da página</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Título Principal</Label>
                <Input
                  id="hero-title"
                  defaultValue={getContent('hero', 'title')}
                  onBlur={(e) => handleSave('hero', 'title', e.target.value)}
                  placeholder="Título principal da hero section"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Subtítulo</Label>
                <Textarea
                  id="hero-subtitle"
                  defaultValue={getContent('hero', 'subtitle')}
                  onBlur={(e) => handleSave('hero', 'subtitle', e.target.value)}
                  placeholder="Descrição da hero section"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-button">Botão Primário</Label>
                  <Input
                    id="primary-button"
                    defaultValue={getContent('hero', 'primary_button')}
                    onBlur={(e) => handleSave('hero', 'primary_button', e.target.value)}
                    placeholder="Texto do botão primário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-button">Botão Secundário</Label>
                  <Input
                    id="secondary-button"
                    defaultValue={getContent('hero', 'secondary_button')}
                    onBlur={(e) => handleSave('hero', 'secondary_button', e.target.value)}
                    placeholder="Texto do botão secundário"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-button-link">Link do Botão Primário</Label>
                  <Input
                    id="primary-button-link"
                    defaultValue={getContent('hero', 'primary_button_link')}
                    onBlur={(e) => handleSave('hero', 'primary_button_link', e.target.value)}
                    placeholder="/auth ou URL externa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-button-link">Link do Botão Secundário</Label>
                  <Input
                    id="secondary-button-link"
                    defaultValue={getContent('hero', 'secondary_button_link')}
                    onBlur={(e) => handleSave('hero', 'secondary_button_link', e.target.value)}
                    placeholder="URL externa ou rota interna"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="primary-button-active"
                    defaultChecked={getContent('hero', 'primary_button_active', 'true') === 'true'}
                    onChange={(e) => handleSave('hero', 'primary_button_active', e.target.checked.toString())}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="primary-button-active">Mostrar Botão Primário</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="secondary-button-active"
                    defaultChecked={getContent('hero', 'secondary_button_active', 'true') === 'true'}
                    onChange={(e) => handleSave('hero', 'secondary_button_active', e.target.checked.toString())}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <Label htmlFor="secondary-button-active">Mostrar Botão Secundário</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges de Confiança</CardTitle>
              <CardDescription>Configure os badges abaixo do hero</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Badge {num} - Texto</Label>
                    <Input
                      defaultValue={getContent('hero', `badge_${num}_text`)}
                      onBlur={(e) => handleSave('hero', `badge_${num}_text`, e.target.value)}
                      placeholder={`Texto do badge ${num}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ícone</Label>
                    <IconPicker
                      value={getContent('hero', `badge_${num}_icon`)}
                      onChange={(icon) => handleSave('hero', `badge_${num}_icon`, icon, 'icon')}
                    />
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-accent text-white px-4 py-2">
                      {getContent('hero', `badge_${num}_text`, `Badge ${num}`)}
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