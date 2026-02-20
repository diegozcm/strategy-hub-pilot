import { FileUp } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportCompanyDataCardProps {
  onClick: () => void;
}

export function ImportCompanyDataCard({ onClick }: ImportCompanyDataCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors border-cofound-blue-light/30"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <FileUp className="h-4 w-4 text-cofound-blue-light" />
          Importar Dados
        </CardTitle>
        <CardDescription>
          Importar dados de outra empresa a partir de arquivo XLSX exportado
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
