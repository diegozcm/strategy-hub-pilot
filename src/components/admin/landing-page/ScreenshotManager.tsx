import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DemoImageCropUpload } from './DemoImageCropUpload';
import { EditableField } from './EditableField';
import { cn } from '@/lib/utils';

interface ScreenshotManagerProps {
  screenshotNumber: number;
  title: string;
  description: string;
  module: string;
  imageUrl: string;
  isEditing?: boolean;
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
  isEditing = false,
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
        <EditableField
          id={`screenshot_${screenshotNumber}_title`}
          label="Título"
          value={title}
          isEditing={isEditing}
          placeholder="Título do screenshot"
          onChange={onTitleChange}
        />

        <EditableField
          id={`screenshot_${screenshotNumber}_description`}
          label="Descrição"
          value={description}
          isEditing={isEditing}
          placeholder="Descrição do screenshot"
          type="textarea"
          rows={2}
          onChange={onDescriptionChange}
        />

        {isEditing ? (
          <div className="space-y-2">
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
        ) : (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Módulo</Label>
            <div className={cn(
              "p-3 border rounded-md bg-muted/50",
              "text-sm text-muted-foreground",
              module ? "text-foreground" : "italic"
            )}>
              {module || "(Módulo não definido)"}
            </div>
          </div>
        )}

        <div>
          <Label>Imagem do Screenshot</Label>
          <DemoImageCropUpload
            currentValue={imageUrl}
            onImageChange={onImageChange}
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};