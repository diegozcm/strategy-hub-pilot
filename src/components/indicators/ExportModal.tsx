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
    target: number | null;
    actual: number | null;
    result: number | null;
    efficiency: number | null;
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

  // Prepare element for export - fix text clipping and icon rendering
  const prepareForExport = (element: HTMLElement): HTMLElement => {
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply export-friendly styles to all elements
    clone.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Fix text clipping issues
      if (computedStyle.overflow === 'hidden' || computedStyle.textOverflow === 'ellipsis') {
        htmlEl.style.overflow = 'visible';
        htmlEl.style.textOverflow = 'unset';
        htmlEl.style.whiteSpace = 'normal';
      }
      
      // Remove line-clamp
      if (htmlEl.classList.contains('line-clamp-2') || htmlEl.classList.contains('line-clamp-1')) {
        htmlEl.style.webkitLineClamp = 'unset';
        htmlEl.style.display = 'block';
        htmlEl.style.overflow = 'visible';
      }
      
      // Add padding to table cells
      if (htmlEl.tagName === 'TD' || htmlEl.tagName === 'TH') {
        htmlEl.style.padding = '12px 16px';
      }
    });
    
    // Replace efficiency badges with simple spans that have explicit inline styles
    clone.querySelectorAll('[class*="rounded-full"]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim() || '';
      
      // Check if this is an efficiency badge by its text content
      if (['Excelente', 'No Alvo', 'Atenção', 'Crítico'].includes(text)) {
        // Create a new span element with completely inline styles
        const newSpan = document.createElement('span');
        newSpan.textContent = text;
        
        // Determine background color based on badge type
        let bgColor = '#6b7280'; // gray default
        if (text === 'Excelente') {
          bgColor = '#3b82f6'; // blue-500
        } else if (text === 'No Alvo') {
          bgColor = '#22c55e'; // green-500
        } else if (text === 'Atenção') {
          bgColor = '#eab308'; // yellow-500
        } else if (text === 'Crítico') {
          bgColor = '#ef4444'; // red-500
        }
        
        // Apply all styles as inline cssText - html2canvas respects this better
        newSpan.style.cssText = `
          display: inline-block !important;
          padding: 4px 12px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          color: white !important;
          background-color: ${bgColor} !important;
          border-radius: 9999px !important;
          border: none !important;
          white-space: nowrap !important;
          text-align: center !important;
          box-sizing: border-box !important;
        `;
        
        // Replace the original badge element with the new span
        if (htmlEl.parentNode) {
          htmlEl.parentNode.replaceChild(newSpan, htmlEl);
        }
      }
    });
    
    // Replace SVG icons with Unicode symbols
    clone.querySelectorAll('svg').forEach((svg) => {
      const span = document.createElement('span');
      span.style.fontSize = '14px';
      span.style.fontWeight = 'bold';
      
      // Check SVG class or parent context
      const svgClasses = svg.className.baseVal || '';
      const parentClasses = svg.parentElement?.className || '';
      
      if (svgClasses.includes('text-green') || parentClasses.includes('text-green')) {
        span.textContent = '▲';
        span.style.color = '#16a34a';
      } else if (svgClasses.includes('text-red') || parentClasses.includes('text-red')) {
        span.textContent = '▼';
        span.style.color = '#dc2626';
      } else if (svgClasses.includes('text-blue') || parentClasses.includes('text-blue')) {
        span.textContent = '★';
        span.style.color = '#2563eb';
      } else if (svgClasses.includes('text-yellow') || parentClasses.includes('text-yellow')) {
        span.textContent = '◆';
        span.style.color = '#ca8a04';
      } else {
        // Generic icon replacement
        span.textContent = '•';
        span.style.color = '#6b7280';
      }
      
      svg.parentNode?.replaceChild(span, svg);
    });
    
    return clone;
  };

  const handleExportPNG = async () => {
    if (!tableRef.current) {
      toast({ title: 'Erro', description: 'Tabela não encontrada', variant: 'destructive' });
      return;
    }
    
    setExporting('png');
    try {
      // Prepare clone for better rendering
      const clone = prepareForExport(tableRef.current);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${tableRef.current.scrollWidth}px`;
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });
      
      // Remove clone
      document.body.removeChild(clone);
      
      const link = document.createElement('a');
      link.download = `${title.replace(/[\s\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}_${new Date().toISOString().split('T')[0]}.png`;
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
      // Prepare clone for better rendering
      const clone = prepareForExport(tableRef.current);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = `${tableRef.current.scrollWidth}px`;
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });
      
      // Remove clone
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Use A4 size with proper margins - prefer landscape for tables
      const pdf = new jsPDF({
        orientation: 'landscape',
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
      pdf.save(`${title.replace(/[\s\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({ title: 'Sucesso!', description: 'PDF exportado com sucesso' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({ title: 'Erro', description: 'Falha ao exportar PDF', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const formatValue = (value: number | null | undefined, unit: string): string => {
    if (value == null) return '—';
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
          row.efficiency != null ? `${row.efficiency.toFixed(1)}%` : '—'
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
      
      XLSX.writeFile(workbook, `${title.replace(/[\s\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
