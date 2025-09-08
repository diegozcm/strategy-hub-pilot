import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Shield, 
  Calendar, 
  Building, 
  User,
  Users,
  Target,
  BarChart3,
  Brain,
  ClipboardCheck,
  Bot,
  Award,
  Database
} from 'lucide-react';
import { useDatabaseCleanup, CleanupCategory, CleanupRequest } from '@/hooks/useDatabaseCleanup';
import { DatabaseCleanupModal } from './DatabaseCleanupModal';

export const DatabaseCleanupTab: React.FC = () => {
  const {
    categories,
    loading,
    stats,
    companies,
    users,
    loadCompanies,
    loadUsers,
    loadStats,
    getRecordCount,
    executeCleanup,
  } = useDatabaseCleanup();

  const [selectedCategory, setSelectedCategory] = useState<CleanupCategory | null>(null);
  const [filters, setFilters] = useState<Partial<CleanupRequest>>({});
  const [showModal, setShowModal] = useState(false);
  const [filteredRecordCount, setFilteredRecordCount] = useState<number>(0);
  const [loadingFilteredCount, setLoadingFilteredCount] = useState(false);

  useEffect(() => {
    loadStats();
    loadCompanies();
    loadUsers();
  }, []); // Remove dependencies to prevent infinite loop

  useEffect(() => {
    const updateFilteredCount = async () => {
      if (!selectedCategory) return;
      
      setLoadingFilteredCount(true);
      try {
        const count = await getRecordCount(selectedCategory.id, filters);
        setFilteredRecordCount(count);
      } catch (error) {
        console.error('Error updating filtered count:', error);
        setFilteredRecordCount(0);
      } finally {
        setLoadingFilteredCount(false);
      }
    };

    if (selectedCategory && (filters.companyId || filters.userId || filters.beforeDate)) {
      updateFilteredCount();
    } else if (selectedCategory) {
      const categoryStats = stats.find(s => s.category === selectedCategory.id);
      setFilteredRecordCount(categoryStats?.totalRecords || 0);
    }
  }, [selectedCategory, filters.companyId, filters.userId, filters.beforeDate]); // Optimize dependencies

  const handleCategorySelect = (category: CleanupCategory) => {
    setSelectedCategory(category);
    setFilters({});
    setFilteredRecordCount(0);
  };

  const handleConfirmCleanup = async (request: CleanupRequest) => {
    await executeCleanup(request);
    setShowModal(false);
    setSelectedCategory(null);
    setFilters({});
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Users,
      Target,
      BarChart3,
      Brain,
      ClipboardCheck,
      Bot,
      Award,
    };
    const IconComponent = icons[iconName] || Database;
    return <IconComponent className="h-5 w-5" />;
  };

  const getTotalRecords = (category: string) => {
    const categoryStats = stats.find(s => s.category === category);
    return categoryStats?.totalRecords || 0;
  };

  const isLoading = (category: string) => {
    const categoryStats = stats.find(s => s.category === category);
    return categoryStats?.loading || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-destructive" />
        <div>
          <h2 className="text-2xl font-bold">Limpeza de Dados</h2>
          <p className="text-muted-foreground">
            Remova dados do sistema de forma segura e controlada
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Atenção - Operação Irreversível</h3>
            <p className="text-yellow-700 text-sm mt-1">
              A limpeza de dados é uma operação permanente. Dados excluídos não podem ser recuperados.
              Sempre faça backup antes de executar operações de limpeza.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Categorias Disponíveis</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Contadores
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              category.dangerous ? 'border-orange-200 bg-orange-50/50' : ''
            }`}
            onClick={() => handleCategorySelect(category)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category.icon)}
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                {category.dangerous && (
                  <Badge variant="destructive" className="text-xs">
                    Alto Risco
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de registros:</span>
                <div className="flex items-center gap-2">
                  {isLoading(category.id) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant="secondary">
                      {getTotalRecords(category.id).toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(selectedCategory.icon)}
              Configurar Limpeza: {selectedCategory.name}
            </CardTitle>
            <CardDescription>
              Configure os filtros e execute a limpeza dos dados selecionados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedCategory.supportsFilters.company && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Empresa
                  </Label>
                   <Select
                    value={filters.companyId || ''}
                    onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, companyId: value || undefined }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCategory.supportsFilters.user && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuário
                  </Label>
                   <Select
                    value={filters.userId || ''}
                    onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, userId: value || undefined }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedCategory.supportsFilters.date && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Antes da Data
                  </Label>
                  <Input
                    type="date"
                    value={filters.beforeDate || ''}
                    onChange={(e) => 
                      setFilters(prev => ({ ...prev, beforeDate: e.target.value || undefined }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Descreva o motivo da limpeza..."
                value={filters.notes || ''}
                onChange={(e) => 
                  setFilters(prev => ({ ...prev, notes: e.target.value || undefined }))
                }
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">
                  Registros que serão removidos:
                </span>
                <div className="flex items-center gap-2">
                  {loadingFilteredCount ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Badge variant="destructive">
                      {filteredRecordCount.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button
                variant="destructive"
                onClick={() => setShowModal(true)}
                disabled={loading || filteredRecordCount === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Executar Limpeza
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setFilters({});
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showModal && selectedCategory && (
        <DatabaseCleanupModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          category={selectedCategory}
          filters={filters}
          recordCount={filteredRecordCount}
          onConfirm={handleConfirmCleanup}
          loading={loading}
        />
      )}
    </div>
  );
};