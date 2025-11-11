import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, Eye, Code, Mail } from 'lucide-react';

export const EmailTemplatesPage = () => {
  const { templates, isLoading, updateTemplate, isUpdating } = useEmailTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBody(template.body_html);
    setPreviewMode(false);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;

    updateTemplate({
      id: selectedTemplate.id,
      updates: {
        subject: editedSubject,
        body_html: editedBody,
      },
    });
  };

  const getPreviewHtml = () => {
    if (!editedBody) return '';
    
    // Replace variables with example data for preview
    return editedBody
      .replace(/\{\{userName\}\}/g, 'João Silva')
      .replace(/\{\{email\}\}/g, 'joao.silva@example.com')
      .replace(/\{\{temporaryPassword\}\}/g, 'ABC123')
      .replace(/\{\{companyName\}\}/g, 'Empresa Exemplo')
      .replace(/\{\{loginUrl\}\}/g, window.location.origin + '/auth');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Templates de Email</h1>
        <p className="text-muted-foreground">
          Personalize os emails enviados pelo sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Templates */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Templates Disponíveis
            </CardTitle>
            <CardDescription>
              Selecione um template para editar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates?.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium">{template.template_name}</span>
                  <span className="text-xs text-muted-foreground">{template.template_key}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="md:col-span-2">
          {selectedTemplate ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.template_name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      {previewMode ? <Code className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {previewMode ? 'Editor' : 'Preview'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Variables */}
                <div>
                  <Label className="text-sm font-medium">Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.available_variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="cursor-pointer">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique para copiar. Use essas variáveis no assunto e corpo do email.
                  </p>
                </div>

                <Tabs defaultValue="subject" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="subject">Assunto</TabsTrigger>
                    <TabsTrigger value="body">Corpo do Email</TabsTrigger>
                  </TabsList>

                  <TabsContent value="subject" className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Assunto do Email</Label>
                      <Input
                        id="subject"
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Digite o assunto do email"
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="body" className="space-y-4">
                    {previewMode ? (
                      <div className="border rounded-lg p-4 bg-background">
                        <Label className="mb-2 block">Preview do Email</Label>
                        <div
                          className="border rounded bg-white p-4 max-h-[500px] overflow-auto"
                          dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="body">HTML do Email</Label>
                        <Textarea
                          id="body"
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          placeholder="Cole o HTML do email aqui"
                          className="mt-2 font-mono text-sm min-h-[500px]"
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um template para começar a editar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
