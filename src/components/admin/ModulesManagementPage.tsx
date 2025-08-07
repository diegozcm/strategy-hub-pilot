import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Shield, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

interface SystemModule {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const ModulesManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newModule, setNewModule] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Package',
    active: true
  });

  // Fetch all modules
  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .order('name');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Erro ao carregar módulos",
        description: "Não foi possível carregar a lista de módulos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle module status
  const toggleModuleStatus = async (moduleId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('system_modules')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', moduleId);

      if (error) throw error;

      setModules(prev => prev.map(module => 
        module.id === moduleId ? { ...module, active } : module
      ));

      toast({
        title: active ? "Módulo ativado" : "Módulo desativado",
        description: `O módulo foi ${active ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: "Erro ao atualizar módulo",
        description: "Não foi possível atualizar o status do módulo.",
        variant: "destructive"
      });
    }
  };

  // Create new module
  const createModule = async () => {
    if (!newModule.name || !newModule.slug) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e slug são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('system_modules')
        .insert([{
          name: newModule.name,
          slug: newModule.slug,
          description: newModule.description,
          icon: newModule.icon,
          active: newModule.active
        }])
        .select()
        .single();

      if (error) throw error;

      setModules(prev => [...prev, data]);
      setIsCreateModalOpen(false);
      setNewModule({ name: '', slug: '', description: '', icon: 'Package', active: true });

      toast({
        title: "Módulo criado",
        description: "O novo módulo foi criado com sucesso."
      });
    } catch (error: any) {
      console.error('Error creating module:', error);
      toast({
        title: "Erro ao criar módulo",
        description: error.message || "Não foi possível criar o módulo.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  if (loading) {
    return <div>Carregando módulos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Módulos</h1>
          <p className="text-muted-foreground">
            Configure os módulos disponíveis no sistema
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Módulo</DialogTitle>
              <DialogDescription>
                Adicione um novo módulo ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newModule.name}
                  onChange={(e) => setNewModule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do módulo"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newModule.slug}
                  onChange={(e) => setNewModule(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-do-modulo"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do módulo"
                />
              </div>
              <div>
                <Label htmlFor="icon">Ícone</Label>
                <Input
                  id="icon"
                  value={newModule.icon}
                  onChange={(e) => setNewModule(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Nome do ícone Lucide"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createModule}>Criar Módulo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Módulos do Sistema</span>
          </CardTitle>
          <CardDescription>
            Gerencie os módulos disponíveis e seus status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {module.slug}
                    </code>
                  </TableCell>
                  <TableCell>{module.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={module.active ? 'default' : 'secondary'}>
                      {module.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={module.active}
                        onCheckedChange={(checked) => toggleModuleStatus(module.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement edit functionality
                          toast({
                            title: "Em desenvolvimento",
                            description: "Funcionalidade de edição em breve."
                          });
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};