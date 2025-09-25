import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Crop as CropIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  disabled?: boolean;
  userInitials?: string;
}

export const AvatarCropUpload: React.FC<AvatarCropUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  disabled = false,
  userInitials = 'U',
}) => {
  const { user } = useAuth();
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

  const createThumbnail = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const thumbnailCanvas = document.createElement('canvas');
      const ctx = thumbnailCanvas.getContext('2d');
      
      thumbnailCanvas.width = 50;
      thumbnailCanvas.height = 50;
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, 50, 50);
      }
      
      thumbnailCanvas.toBlob(resolve, 'image/webp', 0.8);
    });
  };

  const handleSaveCrop = async () => {
    if (!completedCrop || !previewCanvasRef.current || !user) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma área para recortar",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Delete old avatar files if they exist
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split('/storage/v1/object/public/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Create main avatar blob
      const avatarBlob = await new Promise<Blob | null>((resolve) => {
        previewCanvasRef.current?.toBlob(resolve, 'image/webp', 0.85);
      });

      if (!avatarBlob) throw new Error('Failed to create avatar image');

      // Create thumbnail blob
      const thumbnailBlob = await createThumbnail(previewCanvasRef.current);
      if (!thumbnailBlob) throw new Error('Failed to create thumbnail');

      // Upload main avatar
      const avatarFileName = `${user.id}/avatar.webp`;
      const { error: avatarError } = await supabase.storage
        .from('avatars')
        .upload(avatarFileName, avatarBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (avatarError) throw avatarError;

      // Upload thumbnail
      const thumbnailFileName = `${user.id}/thumbnail.webp`;
      const { error: thumbnailError } = await supabase.storage
        .from('avatars')
        .upload(thumbnailFileName, thumbnailBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (thumbnailError) throw thumbnailError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarFileName);

      onImageUploaded(publicUrl);
      setIsOpen(false);
      setImageSrc('');

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto de perfil. Tente novamente.",
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
      <div className="relative inline-block">
        <Avatar className="h-32 w-32">
          <AvatarImage src={currentImageUrl || undefined} />
          <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
        </Avatar>
        <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
          <Camera className="h-4 w-4" />
          <Input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="hidden"
            disabled={disabled || uploading}
          />
        </label>
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
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
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    minWidth={100}
                    minHeight={100}
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

                <div className="space-y-2">
                  <Label>Preview do Avatar</Label>
                  <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center">
                    {completedCrop && (
                      <canvas
                        ref={previewCanvasRef}
                        style={{
                          width: 200,
                          height: 200,
                          borderRadius: '50%',
                          border: '2px solid hsl(var(--border))',
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
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? 'Salvando...' : 'Salvar Foto'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};