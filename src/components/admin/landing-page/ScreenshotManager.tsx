import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from './ImageUploader';

interface ScreenshotManagerProps {
  screenshotNumber: number;
  title: string;
  description: string;
  module: string;
  imageUrl: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onImageChange: (url: string) => void;
}

export const ScreenshotManager: React.FC<ScreenshotManagerProps> = ({
  screenshotNumber,
  title,
  description,
  module,
  imageUrl,
  onTitleChange,
  onDescriptionChange,
  onModuleChange,
  onImageChange
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Screenshot {screenshotNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`screenshot_${screenshotNumber}_title`}>Título</Label>
          <Input
            id={`screenshot_${screenshotNumber}_title`}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Título do screenshot"
          />
        </div>

        <div>
          <Label htmlFor={`screenshot_${screenshotNumber}_description`}>Descrição</Label>
          <Textarea
            id={`screenshot_${screenshotNumber}_description`}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Descrição do screenshot"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor={`screenshot_${screenshotNumber}_module`}>Módulo</Label>
          <Select value={module} onValueChange={onModuleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Strategy HUB">Strategy HUB</SelectItem>
              <SelectItem value="Startup HUB">Startup HUB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Imagem do Screenshot</Label>
          <ImageUploader
            section="demo"
            contentKey={`screenshot_${screenshotNumber}_image`}
            currentValue={imageUrl}
            onSuccess={onImageChange}
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};