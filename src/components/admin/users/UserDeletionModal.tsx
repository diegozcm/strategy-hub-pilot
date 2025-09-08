import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types/admin';
import { UserRelations, CompatibleUser, useUserDeletion } from '@/hooks/useUserDeletion';
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
  Trash2
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserDeletionModalProps {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

type DeletionStep = 'analysis' | 'selection' | 'confirmation' | 'progress' | 'completed';

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
      
      // Start analysis
      analyzeUserRelations(user.id).then(() => {
        findCompatibleUsers(user.id);
      });
    }
  }, [open, user, analyzeUserRelations, findCompatibleUsers]);

  const handleReplacementUserSelect = (userId: string) => {
    setSelectedReplacementUser(userId);
  };

  const handleProceedToConfirmation = () => {
    if (selectedReplacementUser) {
      setStep('confirmation');
    }
  };

  const handleConfirmDeletion = async () => {
    if (!user || !selectedReplacementUser || confirmationName !== user.first_name) {
      return;
    }

    setStep('progress');
    setDeletionProgress(0);

    const result = await deleteUserWithReplacement(user.id, selectedReplacementUser);
    
    if (result?.success) {
      setCompletedOperations(result.operations_log || []);
      setDeletionProgress(100);
      setStep('completed');
      setTimeout(() => {
        onDeleted();
        onClose();
      }, 3000);
    } else {
      setStep('analysis');
    }
  };

  const selectedUser = compatibleUsers.find(u => u.user_id === selectedReplacementUser);
  const totalRelations = getTotalRelationsCount(userRelations);
  const criticalRelations = getCriticalRelationsCount(userRelations);

  const renderAnalysisStep = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">Analisando relações do usuário...</span>
        </div>
      ) : userRelations ? (
        <>
          {/* Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Resumo do Impacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{totalRelations}</div>
                  <div className="text-sm text-muted-foreground">Total de Relações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{criticalRelations}</div>
                  <div className="text-sm text-muted-foreground">Relações Críticas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ownership Relations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Propriedades (Crítico - Requer Substituição)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Empresas</span>
                </div>
                <Badge variant={userRelations.ownership.companies?.length ? "destructive" : "secondary"}>
                  {userRelations.ownership.companies?.length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Projetos Estratégicos</span>
                </div>
                <Badge variant={userRelations.ownership.strategic_projects ? "destructive" : "secondary"}>
                  {userRelations.ownership.strategic_projects || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Objetivos e Resultados-Chave</span>
                </div>
                <Badge variant={
                  (userRelations.ownership.strategic_objectives || 0) + (userRelations.ownership.key_results || 0) 
                    ? "destructive" : "secondary"
                }>
                  {(userRelations.ownership.strategic_objectives || 0) + (userRelations.ownership.key_results || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Mentoring Relations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mentoria (Histórico Preservado)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Sessões Históricas (Preservar)</span>
                <Badge variant="secondary">
                  {userRelations.mentoring.mentor_sessions_historical || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Sessões Ativas (Transferir)</span>
                <Badge variant={userRelations.mentoring.mentor_sessions_active ? "destructive" : "secondary"}>
                  {userRelations.mentoring.mentor_sessions_active || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Relações Startup</span>
                <Badge variant={userRelations.mentoring.startup_relations?.length ? "destructive" : "secondary"}>
                  {userRelations.mentoring.startup_relations?.length || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Relations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Atribuições Ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Itens de Ação</span>
                <Badge variant={userRelations.assignment.action_items ? "destructive" : "secondary"}>
                  {userRelations.assignment.action_items || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Recomendações de IA</span>
                <Badge variant={userRelations.assignment.ai_recommendations ? "destructive" : "secondary"}>
                  {userRelations.assignment.ai_recommendations || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Avaliações de Desempenho</span>
                <Badge variant={
                  (userRelations.assignment.performance_reviews_as_reviewer || 0) + 
                  (userRelations.assignment.performance_reviews_as_reviewee || 0) ? "destructive" : "secondary"
                }>
                  {(userRelations.assignment.performance_reviews_as_reviewer || 0) + 
                   (userRelations.assignment.performance_reviews_as_reviewee || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Compatible Users Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Usuários Compatíveis para Substituição
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                  <span className="ml-2">Buscando usuários compatíveis...</span>
                </div>
              ) : compatibleUsers.length > 0 ? (
                <div className="space-y-4">
                  <Select value={selectedReplacementUser} onValueChange={handleReplacementUserSelect}>
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

                  {selectedUser && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Compatibilidade</span>
                            <div className="flex items-center gap-2">
                              <Progress value={selectedUser.compatibility_score} className="w-20" />
                              <span className="text-sm font-medium">{selectedUser.compatibility_score}%</span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>✓ Mesmo role: {selectedUser.compatibility_details.has_same_role ? 'Sim' : 'Não'}</div>
                            <div>✓ Módulos compatíveis: {selectedUser.compatibility_details.compatible_modules?.length || 0}</div>
                            <div>✓ Empresas compartilhadas: {selectedUser.compatibility_details.shared_companies?.length || 0}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    onClick={handleProceedToConfirmation} 
                    className="w-full" 
                    disabled={!selectedReplacementUser}
                  >
                    Prosseguir para Confirmação
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum usuário compatível encontrado. 
                  <br />
                  Este usuário não pode ser excluído sem violar a integridade do sistema.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmação de Exclusão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm">
              <strong>ATENÇÃO:</strong> Esta ação é irreversível. Todos os dados do usuário serão 
              permanentemente removidos e suas relações serão transferidas para o usuário substituto.
            </p>
          </div>

          {selectedUser && (
            <div className="space-y-2">
              <Label>Usuário Substituto Selecionado:</Label>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                    </div>
                    <Badge>{selectedUser.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmName">
              Digite o primeiro nome do usuário para confirmar: <strong>{user?.first_name}</strong>
            </Label>
            <Input
              id="confirmName"
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              placeholder={`Digite "${user?.first_name}" para confirmar`}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('analysis')} className="flex-1">
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDeletion}
              disabled={confirmationName !== user?.first_name}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Usuário
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LoadingSpinner />
            Excluindo Usuário...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={deletionProgress} className="w-full" />
          <div className="text-sm text-muted-foreground text-center">
            Processando exclusão e transferência de dados...
          </div>
          
          {completedOperations.length > 0 && (
            <div className="space-y-2">
              <Label>Operações Realizadas:</Label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {completedOperations.map((operation, index) => (
                  <div key={index} className="text-xs bg-muted p-2 rounded flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    {operation}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="space-y-6 text-center">
      <Card>
        <CardContent className="pt-6">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Usuário Excluído com Sucesso</h3>
          <p className="text-muted-foreground mb-4">
            O usuário foi removido e todos os dados foram transferidos com segurança.
          </p>
          
          {completedOperations.length > 0 && (
            <div className="text-left space-y-2">
              <Label>Resumo das Operações:</Label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {completedOperations.map((operation, index) => (
                  <div key={index} className="text-xs bg-success/10 p-2 rounded flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    {operation}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Excluir Usuário: {user.first_name} {user.last_name}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        {step === 'analysis' && renderAnalysisStep()}
        {step === 'confirmation' && renderConfirmationStep()}
        {step === 'progress' && renderProgressStep()}
        {step === 'completed' && renderCompletedStep()}
      </DialogContent>
    </Dialog>
  );
};