import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Crop as CropIcon, X, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropUploadLocalProps {
  currentImageUrl?: string;
  onImageCropped: (dataUrl: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
  userInitials?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarCropUploadLocal: React.FC<AvatarCropUploadLocalProps> = ({
  currentImageUrl,
  onImageCropped,
  onImageRemoved,
  disabled = false,
  userInitials = 'U',
  size = 'lg',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

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
          1, // 1:1 aspect ratio for avatars
          width,
          height,
        ),
        width,
        height,
      ));
    },
    []
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

  const handleSaveCrop = () => {
    if (!completedCrop || !previewCanvasRef.current) {
      return;
    }

    // Create a fixed-size output canvas (200x200)
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = 200;
    outputCanvas.height = 200;
    const ctx = outputCanvas.getContext('2d');
    
    if (ctx && previewCanvasRef.current) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(previewCanvasRef.current, 0, 0, 200, 200);
      
      // Convert to Data URL
      const dataUrl = outputCanvas.toDataURL('image/webp', 0.85);
      onImageCropped(dataUrl);
    }

    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleDeleteImage = () => {
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-3">
        <div className="relative inline-block">
          <Avatar className={sizeClasses[size]}>
            {currentImageUrl ? (
              <AvatarImage src={currentImageUrl} alt="Avatar" />
            ) : null}
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
            <Camera className="h-4 w-4" />
            <Input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="hidden"
              disabled={disabled}
            />
          </label>
        </div>
        
        {/* Delete button - only show if there's an image */}
        {currentImageUrl && onImageRemoved && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteImage}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Foto
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Recortar Foto de Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {imageSrc && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Imagem Original</Label>
                  <div className="border rounded-lg p-2 bg-muted/30">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      minWidth={50}
                      minHeight={50}
                      keepSelection
                      circularCrop
                    >
                      <img
                        ref={imgRef}
                        alt="Recortar foto"
                        src={imageSrc}
                        style={{ maxHeight: '400px', maxWidth: '100%' }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Arraste para reposicionar • Use as bordas para redimensionar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Preview do Avatar</Label>
                  <div className="border rounded-lg p-6 bg-muted/30 flex items-center justify-center min-h-[280px]">
                    {completedCrop ? (
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: '50%',
                          border: '3px solid hsl(var(--border))',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">Selecione uma área para ver o preview</p>
                      </div>
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
                disabled={!completedCrop}
              >
                <Camera className="h-4 w-4 mr-2" />
                Salvar Foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
