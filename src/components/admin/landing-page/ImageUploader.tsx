import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useLandingPageContent } from '@/hooks/useLandingPageContent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ImageUploaderProps {
  section: string;
  contentKey: string;
  currentValue?: string;
  onSuccess?: (url: string) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  section,
  contentKey,
  currentValue,
  onSuccess,
  className
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentValue || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, updateContent } = useLandingPageContent();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase
      const path = `${section}/${contentKey}`;
      const url = await uploadImage(file, path);

      if (url) {
        // Update content in database
        await updateContent(section, contentKey, url, 'image');
        onSuccess?.(url);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    setPreview(null);
    await updateContent(section, contentKey, '', 'image');
    onSuccess?.('');
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <Card className="relative overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <LoadingSpinner size="sm" /> : <Upload className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          className="border-dashed border-2 p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Clique para fazer upload</p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG ou WebP até 5MB
              </p>
            </div>
            {uploading && <LoadingSpinner size="sm" />}
          </div>
        </Card>
      )}
    </div>
  );
};