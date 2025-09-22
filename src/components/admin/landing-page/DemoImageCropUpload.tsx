import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/card';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import 'react-image-crop/dist/ReactCrop.css';

interface DemoImageCropUploadProps {
  currentValue?: string;
  onImageChange: (url: string) => void;
  className?: string;
  disabled?: boolean;
}

function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = crop.width * pixelRatio * scaleX;
  canvas.height = crop.height * pixelRatio * scaleY;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY,
  );
}

export const DemoImageCropUpload: React.FC<DemoImageCropUploadProps> = ({
  currentValue,
  onImageChange,
  className,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [uploading, setUploading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatio = 16 / 9; // Fixed aspect ratio for demo images

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
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

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setIsOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
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
    setCrop(crop);
  }, []);

  const handleSaveCrop = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    const crop = completedCrop;

    if (!image || !previewCanvas || !crop) {
      console.error('Crop canvas does not exist');
      return;
    }

    if (crop.width <= 0 || crop.height <= 0) {
      console.error('Crop area is too small');
      return;
    }

    setUploading(true);

    try {
      canvasPreview(image, previewCanvas, crop);
      
      previewCanvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          setUploading(false);
          return;
        }

        try {
          const fileExt = 'webp';
          const fileName = `demo-screenshot-${Date.now()}.${fileExt}`;
          const filePath = `demo/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('landing-page')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/webp',
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage
            .from('landing-page')
            .getPublicUrl(uploadData.path);

          onImageChange(data.publicUrl);
          handleClose();
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Erro ao fazer upload da imagem. Tente novamente.');
        } finally {
          setUploading(false);
        }
      }, 'image/webp', 0.85);
    } catch (error) {
      console.error('Error processing crop:', error);
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

  const removeImage = () => {
    onImageChange('');
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="hidden"
        disabled={disabled}
      />

      {currentValue ? (
        <Card className="relative overflow-hidden">
          <img
            src={currentValue}
            alt="Preview"
            className="w-full h-48 object-contain bg-muted/50"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? <LoadingSpinner size="sm" /> : <Upload className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={removeImage}
              disabled={disabled || uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          className="border-dashed border-2 p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Clique para fazer upload</p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG ou WebP até 5MB - Será recortado em 16:9
              </p>
            </div>
            {uploading && <LoadingSpinner size="sm" />}
          </div>
        </Card>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Recortar Imagem</h3>
              <p className="text-sm text-muted-foreground">
                Ajuste o recorte para o formato 16:9 ideal para o carousel
              </p>
            </div>
            
            {imageSrc && (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspectRatio}
                    minWidth={400}
                    minHeight={225}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imageSrc}
                      style={{ maxHeight: '500px', width: 'auto' }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
                
                {completedCrop && (
                  <div className="flex-shrink-0">
                    <div className="text-sm font-medium mb-2">Preview:</div>
                    <canvas
                      ref={previewCanvasRef}
                      style={{
                        border: '1px solid black',
                        objectFit: 'contain',
                        width: Math.min(completedCrop.width, 300),
                        height: Math.min(completedCrop.height, 169),
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCrop} 
                disabled={!completedCrop || uploading}
                className="min-w-[120px]"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Imagem'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};