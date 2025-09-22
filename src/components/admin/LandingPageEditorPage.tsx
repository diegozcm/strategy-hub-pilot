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
          <Card>
            <CardHeader>
              <CardTitle>Seção Demo</CardTitle>
              <CardDescription>Em desenvolvimento - gerencie imagens e textos do demo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Seção Benefits</CardTitle>
              <CardDescription>Em desenvolvimento - configure benefícios e ROI</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Esta seção será implementada em breve.</p>
            </CardContent>
          </Card>
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