import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface SpreadsheetViewerProps {
  url: string;
  className?: string;
}

interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ url, className = '' }) => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar arquivo');
        return res.arrayBuffer();
      })
      .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const parsed: SheetData[] = workbook.SheetNames.map(name => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
          const headers = (json[0] || []).map(String);
          const rows = json.slice(1).map(row => row.map(String));
          return { name, headers, rows };
        });
        setSheets(parsed);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando planilha...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 text-destructive text-sm ${className}`}>
        Erro ao carregar planilha: {error}
      </div>
    );
  }

  if (!sheets.length) {
    return (
      <div className={`text-center py-8 text-muted-foreground text-sm ${className}`}>
        Planilha vazia
      </div>
    );
  }

  const renderTable = (sheet: SheetData) => (
    <div className="h-[500px] overflow-auto w-full">
      <table className="text-sm border-collapse min-w-max">
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted">
            {sheet.headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-foreground border border-border whitespace-nowrap"
              >
                {h || `Col ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-muted/50 transition-colors">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-1.5 border border-border text-foreground whitespace-nowrap"
                  title={cell}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (sheets.length === 1) {
    return <div className={`rounded-lg border overflow-hidden ${className}`}>{renderTable(sheets[0])}</div>;
  }

  return (
    <Tabs defaultValue={sheets[0].name} className={className}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {sheets.map(s => (
          <TabsTrigger key={s.name} value={s.name} className="text-xs">
            {s.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {sheets.map(s => (
        <TabsContent key={s.name} value={s.name} className="rounded-lg border overflow-hidden mt-2">
          {renderTable(s)}
        </TabsContent>
      ))}
    </Tabs>
  );
};
