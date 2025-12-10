import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, FileText, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableRef: React.RefObject<HTMLDivElement>;
  exportData: {
    krTitle: string;
    objective: string;
    pillar: string;
    target: number;
    actual: number;
    result: number;
    efficiency: number;
    unit: string;
  }[];
  title?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onOpenChange,
  tableRef,
  exportData,
  title = 'Tabela RMRE'
}) => {
  const [exporting, setExporting] = useState<'png' | 'pdf' | 'xlsx' | null>(null);

  const handleExportPNG = async () => {
    if (!tableRef.current) {
      toast({ title: 'Erro', description: 'Tabela não encontrada', variant: 'destructive' });
      return;
    }
    
    setExporting('png');
    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: 'Sucesso!', description: 'Imagem PNG exportada com sucesso' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      toast({ title: 'Erro', description: 'Falha ao exportar imagem', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) {
      toast({ title: 'Erro', description: 'Tabela não encontrada', variant: 'destructive' });
      return;
    }
    
    setExporting('pdf');
    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Use A4 size with proper margins
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = margin;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: 'Sucesso!', description: 'PDF exportado com sucesso' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({ title: 'Erro', description: 'Falha ao exportar PDF', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'R$') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 1 });
  };

  const handleExportXLSX = () => {
    setExporting('xlsx');
    try {
      const worksheetData = [
        ['Resultado-Chave', 'Objetivo', 'Pilar', 'Meta', 'Real', 'Resultado', 'Eficiência (%)'],
        ...exportData.map(row => [
          row.krTitle,
          row.objective,
          row.pillar,
          formatValue(row.target, row.unit),
          formatValue(row.actual, row.unit),
          formatValue(row.result, row.unit),
          `${row.efficiency.toFixed(1)}%`
        ])
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RMRE');
      
      // Ajustar largura das colunas
      worksheet['!cols'] = [
        { wch: 45 }, // KR
        { wch: 35 }, // Objetivo
        { wch: 20 }, // Pilar
        { wch: 15 }, // Meta
        { wch: 15 }, // Real
        { wch: 15 }, // Resultado
        { wch: 15 }, // Eficiência
      ];
      
      XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({ title: 'Sucesso!', description: 'Planilha Excel exportada com sucesso' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error);
      toast({ title: 'Erro', description: 'Falha ao exportar planilha', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exportar Tabela RMRE
          </DialogTitle>
          <DialogDescription>
            Escolha o formato de exportação desejado
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 py-6">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-3 h-28 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={handleExportPNG}
            disabled={exporting !== null}
          >
            {exporting === 'png' ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Image className="h-8 w-8 text-emerald-600" />
            )}
            <div className="text-center">
              <p className="font-medium">PNG</p>
              <p className="text-xs text-muted-foreground">Imagem</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-3 h-28 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={handleExportPDF}
            disabled={exporting !== null}
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <FileText className="h-8 w-8 text-red-600" />
            )}
            <div className="text-center">
              <p className="font-medium">PDF</p>
              <p className="text-xs text-muted-foreground">Documento</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-3 h-28 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={handleExportXLSX}
            disabled={exporting !== null}
          >
            {exporting === 'xlsx' ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
            )}
            <div className="text-center">
              <p className="font-medium">Excel</p>
              <p className="text-xs text-muted-foreground">Planilha</p>
            </div>
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={exporting !== null}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
