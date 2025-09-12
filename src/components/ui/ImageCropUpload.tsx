import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Crop as CropIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from '@/hooks/use-toast';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  disabled?: boolean;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export const ImageCropUpload: React.FC<ImageCropUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  disabled = false,
  aspectRatio = 1,
  minWidth = 200,
  minHeight = 200,
}) => {
  const { user, company } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setIsOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
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
      ));
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
    if (!completedCrop || !previewCanvasRef.current || !user || !company) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma área para recortar",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        previewCanvasRef.current?.toBlob(resolve, 'image/webp', 0.8);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Create file name
      const fileName = `${company.id}-${Date.now()}.webp`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      setIsOpen(false);
      setImageSrc('');

      toast({
        title: "Sucesso",
        description: "Logo carregado com sucesso",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logo. Tente novamente.",
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
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Logo da Empresa</Label>
        <div className="flex items-center gap-4">
          {currentImageUrl && (
            <div className="relative">
              <img 
                src={currentImageUrl} 
                alt="Logo atual" 
                className="h-16 w-16 object-cover rounded-lg border"
              />
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              disabled={disabled}
              className="hidden"
              id="logo-upload"
            />
            <Button 
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {currentImageUrl ? 'Alterar Logo' : 'Carregar Logo'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Recortar Imagem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {imageSrc && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Imagem Original</Label>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspectRatio}
                    minWidth={minWidth}
                    minHeight={minHeight}
                    keepSelection
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imageSrc}
                      style={{ maxHeight: '400px', maxWidth: '100%' }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>

                <div className="space-y-2">
                  <Label>Preview do Recorte</Label>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    {completedCrop && (
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          width: Math.min(completedCrop.width, 200),
                          height: Math.min(completedCrop.height, 200),
                          border: '1px solid #000',
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
                {uploading ? 'Enviando...' : 'Salvar Logo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};