import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGovernanceRuleDocument } from '@/hooks/useGovernanceRuleDocument';
import { useCurrentModuleRole } from '@/hooks/useCurrentModuleRole';
import { Upload, Download, Replace, Trash2, BookOpen, Maximize2, FileText, FileSpreadsheet, FileIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-10 w-10 text-destructive" />;
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls'))
    return <FileSpreadsheet className="h-10 w-10 text-primary" />;
  return <FileIcon className="h-10 w-10 text-cofound-blue-light" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdf = (fileType: string) => fileType === 'application/pdf';

export const GovernanceRulesSection: React.FC = () => {
  const { document: doc, signedUrl, isLoading, uploadDocument, removeDocument, downloadDocument } = useGovernanceRuleDocument();
  const { canEdit } = useCurrentModuleRole();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      return; // 20MB limit
    }
    uploadDocument.mutate(file);
  }, [uploadDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>;
  }

  // State: No document
  if (!doc) {
    if (!canEdit) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum documento de regras cadastrado</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <BookOpen className="h-5 w-5 text-cofound-blue-light" />
            Documento de Regras de Governança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Arraste um arquivo aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word, Excel, PowerPoint — máx. 20MB
            </p>
            {uploadDocument.isPending && (
              <p className="text-xs text-primary mt-2">Enviando...</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // State: Document exists
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <BookOpen className="h-5 w-5 text-cofound-blue-light" />
            Documento de Regras de Governança
          </CardTitle>
          <div className="flex gap-2">
            {isPdf(doc.file_type) && (
              <Button size="sm" variant="outline" onClick={() => setFullscreenOpen(true)}>
                <Maximize2 className="h-4 w-4 mr-1" /> Tela cheia
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={downloadDocument}>
              <Download className="h-4 w-4 mr-1" /> Baixar
            </Button>
            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={uploadDocument.isPending}
                >
                  <Replace className="h-4 w-4 mr-1" /> Trocar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O documento "{doc.file_name}" será removido permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeDocument.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPdf(doc.file_type) && signedUrl ? (
            <iframe
              src={signedUrl}
              className="w-full h-[500px] rounded-lg border"
              title={doc.file_name}
            />
          ) : (
            <div className="flex items-center gap-4 p-6 rounded-lg border bg-muted/30">
              {getFileIcon(doc.file_type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(doc.file_size)} • {doc.file_type.split('/').pop()?.toUpperCase()}
                </p>
              </div>
              <Button size="sm" variant="cofound" onClick={downloadDocument}>
                <Download className="h-4 w-4 mr-1" /> Abrir
              </Button>
            </div>
          )}
          {uploadDocument.isPending && (
            <p className="text-xs text-primary mt-2 text-center">Enviando novo documento...</p>
          )}
        </CardContent>
      </Card>

      {/* Hidden replace input */}
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />

      {/* Fullscreen PDF viewer */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <DialogTitle className="font-display text-lg">{doc.file_name}</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={downloadDocument}>
                <Download className="h-4 w-4 mr-1" /> Baixar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFullscreenOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {signedUrl && (
            <iframe
              src={signedUrl}
              className="w-full flex-1 min-h-0"
              style={{ height: 'calc(95vh - 80px)' }}
              title={doc.file_name}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
