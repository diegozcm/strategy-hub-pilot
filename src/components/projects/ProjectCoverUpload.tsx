import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Crop as CropIcon, X, ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from '@/hooks/use-toast';
import 'react-image-crop/dist/ReactCrop.css';

interface ProjectCoverUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
  projectId?: string;
}

export const ProjectCoverUpload: React.FC<ProjectCoverUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
  projectId,
}) => {
  const { user, company } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio 16:9 for cover images
  const aspectRatio = 16 / 9;

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setIsOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspectRatio,
          width,
          height,
        ),
        width,
        height,
      );
      
      setCrop(initialCrop);
      
      // Calculate pixel crop for immediate save capability
      const pixelCrop: PixelCrop = {
        x: (initialCrop.x / 100) * width,
        y: (initialCrop.y / 100) * height,
        width: (initialCrop.width / 100) * width,
        height: (initialCrop.height / 100) * height,
        unit: 'px'
      };
      
      setCompletedCrop(pixelCrop);
    },
    [aspectRatio]
  );

  const canvasPreview = useCallback(
    (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio;

      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY,
      );
    },
    []
  );

  React.useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop, canvasPreview]);

  const handleSaveCrop = async () => {
    if (!completedCrop || !previewCanvasRef.current) {
      toast({
        title: "Erro",
        description: "Por favor, aguarde o carregamento completo da imagem",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        previewCanvasRef.current?.toBlob(resolve, 'image/webp', 0.85);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Create file name
      const fileName = `${projectId || 'new'}-${Date.now()}.webp`;
      const filePath = `covers/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('project-covers')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-covers')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      handleClose();

      toast({
        title: "Sucesso",
        description: "Imagem de capa salva com sucesso!",
      });
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    onImageRemoved?.();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onSelectFile}
        disabled={disabled}
        className="hidden"
      />

      {/* Upload Area */}
      <div className="space-y-2">
        {currentImageUrl ? (
          <div className="relative group">
            <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
              <img 
                src={currentImageUrl} 
                alt="Capa do projeto" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button 
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerFileSelect}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Alterar
              </Button>
              {onImageRemoved && (
                <Button 
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div 
            onClick={triggerFileSelect}
            className="aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:bg-muted hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Adicionar imagem de capa</p>
              <p className="text-xs text-muted-foreground">Clique para fazer upload (16:9)</p>
            </div>
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Recortar Imagem de Capa
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {imageSrc && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Selecione a área (16:9)</p>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspectRatio}
                    minWidth={100}
                    keepSelection
                  >
                    <img
                      ref={imgRef}
                      alt="Imagem para recorte"
                      src={imageSrc}
                      style={{ maxHeight: '400px', maxWidth: '100%' }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Preview</p>
                  <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center">
                    {completedCrop && (
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          width: '100%',
                          maxWidth: '320px',
                          aspectRatio: '16/9',
                          objectFit: 'contain',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCrop} 
                disabled={uploading || !completedCrop}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Salvar Capa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
