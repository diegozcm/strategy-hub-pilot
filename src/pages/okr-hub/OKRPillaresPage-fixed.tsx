import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OKRPillarCard } from "@/components/okr-planning/OKRPillarCard";
import { OKRPillarFormModal } from "@/components/okr-planning/OKRPillarFormModal";
import { OKRYearSelector } from "@/components/okr-planning/OKRYearSelector";
import { useOKRYears } from "@/hooks/useOKRYears";
import { useOKRPillars } from "@/hooks/useOKRPillars";
import { useOKRPermissions } from "@/hooks/useOKRPermissions";
import { useAuth } from "@/hooks/useMultiTenant";
import { OKRPillar } from "@/types/okr";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function OKRPillaresPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const { years, currentYear, setCurrentYear, loading: yearsLoading } = useOKRYears();
  const { pillars, loading: pillarsLoading, fetchPillars, createPillar, updatePillar, deletePillar } = useOKRPillars();
  const { canCreatePillar } = useOKRPermissions();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPillar, setEditingPillar] = useState<OKRPillar | null>(null);
  const [deletingPillarId, setDeletingPillarId] = useState<string | null>(null);

  useEffect(() => {
    if (currentYear?.id && company?.id) {
      fetchPillars(currentYear.id);
    }
  }, [currentYear?.id, company?.id]);

  const handleCreatePillar = () => {
    setEditingPillar(null);
    setShowFormModal(true);
  };

  const handleEditPillar = (pillar: OKRPillar) => {
    setEditingPillar(pillar);
    setShowFormModal(true);
  };

  const handleSavePillar = async (data: Partial<OKRPillar>) => {
    if (editingPillar) {
      await updatePillar(editingPillar.id, data);
    } else {
      await createPillar(data as any);
    }
    setShowFormModal(false);
    setEditingPillar(null);
  };

  const handleDeletePillar = async () => {
    if (!deletingPillarId) return;
    
    await deletePillar(deletingPillarId);
    setDeletingPillarId(null);
  };

  if (!company) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Selecione uma empresa para continuar
        </div>
      </div>
    );
  }

  const loading = yearsLoading || pillarsLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pilares Estratégicos</h1>
          <p className="text-muted-foreground mt-1">
            Estruture seus objetivos em pilares com sponsors responsáveis
          </p>
        </div>
        {canCreatePillar && currentYear && (
          <Button onClick={handleCreatePillar}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pilar
          </Button>
        )}
      </div>

      {/* Year Selector */}
      <OKRYearSelector 
        years={years}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        loading={yearsLoading}
      />

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando pilares...
        </div>
      ) : !currentYear ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum ano OKR foi criado ainda
          </p>
        </div>
      ) : pillars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum pilar criado para este ano ainda
          </p>
          {canCreatePillar && (
            <Button onClick={handleCreatePillar}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Pilar
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => (
            <OKRPillarCard
              key={pillar.id}
              pillar={pillar}
              onEdit={handleEditPillar}
              onDelete={setDeletingPillarId}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {currentYear && (
        <OKRPillarFormModal
          open={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingPillar(null);
          }}
          onSave={handleSavePillar}
          pillar={editingPillar}
          yearId={currentYear.id}
          companyId={company.id}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPillarId} onOpenChange={() => setDeletingPillarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pilar? Todos os objetivos associados também serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePillar}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
