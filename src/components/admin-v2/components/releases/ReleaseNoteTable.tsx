import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type ReleaseNote = Database["public"]["Tables"]["release_notes"]["Row"];

const tagColors: Record<string, string> = {
  "Nova Funcionalidade": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Melhoria: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Correção: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

interface ReleaseNoteTableProps {
  data: ReleaseNote[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ReleaseNoteTable({ data, onDelete, isDeleting }: ReleaseNoteTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Versão</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-[130px]">Data</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhuma release encontrada.
              </TableCell>
            </TableRow>
          ) : (
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-medium">{r.version}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(r.date), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {r.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className={tagColors[tag] ?? ""}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={r.published ? "default" : "outline"}>
                    {r.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => navigate(`/app/admin/releases/${r.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir release?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A release <strong>v{r.version}</strong> será excluída permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(r.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
