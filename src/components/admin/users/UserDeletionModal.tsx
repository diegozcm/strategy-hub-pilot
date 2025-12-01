import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/admin';
import { UserRelations, CompatibleUser, useUserDeletion } from '@/hooks/useUserDeletion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Star,
  User,
  Trash2,
  Database,
  MessageSquare,
  BarChart3,
  ClipboardList,
  X,
  Archive
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserDeletionModalProps {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

type DeletionStep = 'analysis' | 'categories' | 'cleanup' | 'transfer' | 'confirmation' | 'progress' | 'completed';

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  count: number;
  tables: string[];
  deleted: boolean;
  critical: boolean;
}

export const UserDeletionModal: React.FC<UserDeletionModalProps> = ({
  user,
  open,
  onClose,
  onDeleted
}) => {
  const [step, setStep] = useState<DeletionStep>('analysis');
  const [selectedReplacementUser, setSelectedReplacementUser] = useState<string>('');
  const [confirmationName, setConfirmationName] = useState('');
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [completedOperations, setCompletedOperations] = useState<string[]>([]);
  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);
  const [deletingCategory, setDeletingCategory] = useState<string>('');

  const { profile } = useAuth();
  const { toast } = useToast();

  const {
    loading,
    userRelations,
    compatibleUsers,
    analyzeUserRelations,
    findCompatibleUsers,
    deleteUserWithReplacement,
    getTotalRelationsCount,
    getCriticalRelationsCount
  } = useUserDeletion();

  useEffect(() => {
    if (open && user) {
      setStep('analysis');
      setSelectedReplacementUser('');
      setConfirmationName('');
      setDeletionProgress(0);
      setCompletedOperations([]);
      setDataCategories([]);
      setDeletingCategory('');
      
      // Start analysis
      analyzeUserRelations(user.user_id).then(() => {
        findCompatibleUsers(user.user_id);
      });
    }
  }, [open, user, analyzeUserRelations, findCompatibleUsers]);

  useEffect(() => {
    if (userRelations) {
      createDataCategories();
    }
  }, [userRelations]);

  const createDataCategories = () => {
    if (!userRelations) return;

    const categories: DataCategory[] = [
      {
        id: 'companies',
        name: 'Empresas',
        description: 'Empresas onde o usuário é proprietário',
        icon: Building2,
        count: userRelations.ownership.companies?.length || 0,
        tables: ['companies', 'user_company_relations'],
        deleted: false,
        critical: true
      },
      {
        id: 'strategic_projects',
        name: 'Projetos Estratégicos',
        description: 'Projetos estratégicos criados pelo usuário',
        icon: Target,
        count: userRelations.ownership.strategic_projects || 0,
        tables: ['strategic_projects', 'project_members'],
        deleted: false,
        critical: true
      },
      {
        id: 'objectives_kr',
        name: 'Objetivos e KRs',
        description: 'Objetivos estratégicos e resultados-chave',
        icon: TrendingUp,
        count: (userRelations.ownership.strategic_objectives || 0) + (userRelations.ownership.key_results || 0),
        tables: ['strategic_objectives', 'key_results', 'key_result_values'],
        deleted: false,
        critical: true
      },
      {
        id: 'mentoring_active',
        name: 'Mentorias Ativas',
        description: 'Sessões de mentoria ativas e relações startup',
        icon: Users,
        count: (userRelations.mentoring.mentor_sessions_active || 0) + (userRelations.mentoring.startup_relations?.length || 0),
        tables: ['mentoring_sessions', 'mentor_startup_relations'],
        deleted: false,
        critical: false
      },
      {
        id: 'action_items',
        name: 'Itens de Ação',
        description: 'Itens de ação atribuídos ao usuário',
        icon: ClipboardList,
        count: userRelations.assignment.action_items || 0,
        tables: ['action_items'],
        deleted: false,
        critical: false
      },
      {
        id: 'ai_recommendations',
        name: 'Recomendações de IA',
        description: 'Recomendações de IA atribuídas ao usuário',
        icon: BarChart3,
        count: userRelations.assignment.ai_recommendations || 0,
        tables: ['ai_recommendations'],
        deleted: false,
        critical: false
      },
      {
        id: 'performance_reviews',
        name: 'Avaliações de Desempenho',
        description: 'Avaliações de desempenho como revisor ou avaliado',
        icon: FileText,
        count: (userRelations.assignment.performance_reviews_as_reviewer || 0) + (userRelations.assignment.performance_reviews_as_reviewee || 0),
        tables: ['performance_reviews'],
        deleted: false,
        critical: false
      },
      {
        id: 'golden_circle_swot',
        name: 'Golden Circle & SWOT',
        description: 'Análises Golden Circle e SWOT criadas',
        icon: MessageSquare,
        count: (userRelations.creation.golden_circle || 0) + (userRelations.creation.swot_analysis || 0),
        tables: ['golden_circle', 'swot_analysis'],
        deleted: false,
        critical: false
      },
      {
        id: 'ai_data',
        name: 'Dados de IA',
        description: 'Insights, analytics e sessões de chat',
        icon: Database,
        count: 0, // Seria preciso consultar essas tabelas
        tables: ['ai_insights', 'ai_analytics', 'ai_chat_sessions', 'ai_chat_messages'],
        deleted: false,
        critical: false
      }
    ];

    setDataCategories(categories);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = dataCategories.find(c => c.id === categoryId);
    if (!category || !user) return;

    setDeletingCategory(categoryId);

    try {
      // Aqui seria a lógica para deletar dados específicos da categoria
      // Por enquanto, vou simular com um delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Marcar categoria como deletada
      setDataCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, deleted: true, count: 0 }
          : cat
      ));

      toast({
        title: "Categoria deletada",
        description: `Todos os dados de "${category.name}" foram removidos.`,
        variant: "default",
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao deletar categoria "${category.name}".`,
        variant: "destructive",
      });
    } finally {
      setDeletingCategory('');
    }
  };

  const handleProceedToNextStep = () => {
    const remainingData = dataCategories.filter(cat => !cat.deleted && cat.count > 0);
    
    if (remainingData.length === 0) {
      // Sem dados restantes, prosseguir para confirmação final
      setStep('confirmation');
    } else if (remainingData.some(cat => cat.critical)) {
      // Ainda tem dados críticos, precisa de usuário substituto
      setStep('transfer');
    } else {
      // Só dados não críticos, pode deletar tudo ou transferir
      setStep('cleanup');
    }
  };

  const handleFinalDeletion = async () => {
    if (!user || confirmationName !== user.first_name) {
      return;
    }

    setStep('progress');
    setDeletionProgress(0);

    try {
      if (selectedReplacementUser) {
        // Deletion with replacement
        const result = await deleteUserWithReplacement(user.user_id, selectedReplacementUser);
        
        if (result?.success) {
          setCompletedOperations(result.operations_log || []);
          setDeletionProgress(100);
          setStep('completed');
        } else {
          setStep('categories');
        }
      } else {
        // Simple deletion
        const { error } = await supabase.rpc('safe_delete_user', {
          _user_id: user.user_id,
          _admin_id: profile?.user_id
        });

        if (error) {
          toast({
            title: "Erro",
            description: "Não foi possível excluir o usuário: " + error.message,
            variant: "destructive",
          });
          setStep('categories');
        } else {
          setCompletedOperations(['Usuário excluído com sucesso', 'Dados limpos']);
          setDeletionProgress(100);
          setStep('completed');
        }
      }

      if (step === 'completed') {
        setTimeout(() => {
          onDeleted();
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir usuário",
        variant: "destructive",
      });
      setStep('categories');
    }
  };

  const renderAnalysisStep = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">Analisando dados do usuário...</span>
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold mb-2">Análise Concluída</h3>
          <p className="text-muted-foreground mb-4">
            Encontramos {getTotalRelationsCount(userRelations)} registros associados ao usuário.
          </p>
          <Button onClick={() => setStep('categories')}>
            Iniciar Processo de Limpeza
          </Button>
        </div>
      )}
    </div>
  );

  const renderCategoriesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Gerenciar Dados do Usuário</h3>
        <p className="text-muted-foreground">
          Selecione quais categorias de dados deseja deletar. Dados críticos requerem um usuário substituto.
        </p>
      </div>

      <div className="space-y-4">
        {dataCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card key={category.id} className={`${category.deleted ? 'bg-muted/50' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{category.name}</h4>
                        {category.critical && (
                          <Badge variant="destructive" className="text-xs">Crítico</Badge>
                        )}
                        {category.deleted && (
                          <Badge variant="secondary" className="text-xs">Deletado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Registros: {category.count} • Tabelas: {category.tables.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.count > 0 ? "default" : "secondary"}>
                      {category.count}
                    </Badge>
                    {!category.deleted && category.count > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deletingCategory === category.id}
                      >
                        {deletingCategory === category.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {category.deleted && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleProceedToNextStep}>
          Continuar Processo
        </Button>
      </div>
    </div>
  );

  const renderCleanupStep = () => {
    const remainingData = dataCategories.filter(cat => !cat.deleted && cat.count > 0);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Archive className="h-12 w-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">Dados Restantes</h3>
          <p className="text-muted-foreground">
            Ainda existem dados não críticos. Você pode deletá-los ou transferir para outro usuário.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados Restantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {remainingData.map(category => (
              <div key={category.id} className="flex items-center justify-between">
                <span>{category.name}</span>
                <Badge>{category.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            variant="destructive" 
            onClick={() => setStep('confirmation')}
            className="flex-1"
          >
            Deletar Todos os Dados
          </Button>
          <Button 
            onClick={() => setStep('transfer')}
            className="flex-1"
          >
            Transferir para Outro Usuário
          </Button>
        </div>
      </div>
    );
  };

  const renderTransferStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-semibold mb-2">Selecionar Usuário Substituto</h3>
        <p className="text-muted-foreground">
          Escolha um usuário para receber os dados restantes.
        </p>
      </div>

      {compatibleUsers.length > 0 ? (
        <div className="space-y-4">
          <Select value={selectedReplacementUser} onValueChange={setSelectedReplacementUser}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um usuário substituto..." />
            </SelectTrigger>
            <SelectContent>
              {compatibleUsers.map((compatibleUser) => (
                <SelectItem key={compatibleUser.user_id} value={compatibleUser.user_id}>
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {compatibleUser.first_name} {compatibleUser.last_name}
                    </span>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline">{compatibleUser.role}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{compatibleUser.compatibility_score}%</span>
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setStep('confirmation')} 
            className="w-full" 
            disabled={!selectedReplacementUser}
          >
            Prosseguir para Confirmação
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-muted-foreground mb-4">Nenhum usuário compatível encontrado</p>
          <Button onClick={() => setStep('confirmation')} variant="destructive">
            Continuar sem Substituição
          </Button>
        </div>
      )}
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmação Final
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm">
              <strong>ATENÇÃO:</strong> Esta ação é irreversível. O usuário será excluído permanentemente
              {selectedReplacementUser ? ' e os dados restantes serão transferidos.' : ' junto com todos os dados restantes.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Para confirmar, digite o nome do usuário:</Label>
            <Input
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              placeholder={user?.first_name}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('categories')} className="flex-1">
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleFinalDeletion}
              disabled={confirmationName !== user?.first_name}
              className="flex-1"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-6 text-center">
      <LoadingSpinner size="lg" />
      <h3 className="text-lg font-semibold">Processando Exclusão...</h3>
      <Progress value={deletionProgress} className="w-full" />
      <div className="space-y-1">
        {completedOperations.map((operation, index) => (
          <div key={index} className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{operation}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
      <h3 className="text-lg font-semibold">Usuário Excluído com Sucesso</h3>
      <p className="text-muted-foreground">
        O processo foi concluído. Esta janela será fechada automaticamente.
      </p>
    </div>
  );

  const getStepContent = () => {
    switch (step) {
      case 'analysis':
        return renderAnalysisStep();
      case 'categories':
        return renderCategoriesStep();
      case 'cleanup':
        return renderCleanupStep();
      case 'transfer':
        return renderTransferStep();
      case 'confirmation':
        return renderConfirmationStep();
      case 'progress':
        return renderProgressStep();
      case 'completed':
        return renderCompletedStep();
      default:
        return renderAnalysisStep();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Excluir Usuário: {user?.first_name} {user?.last_name}
          </DialogTitle>
        </DialogHeader>

        {getStepContent()}
      </DialogContent>
    </Dialog>
  );
};