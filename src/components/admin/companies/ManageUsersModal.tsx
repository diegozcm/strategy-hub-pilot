import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, UserPlus, UserCheck, UserMinus, Link2, Unlink } from 'lucide-react';
import { Company, CompanyUser } from '@/types/admin';

interface ManageUsersModalProps {
  company: Company;
  availableUsers: CompanyUser[];
  companyUsers: CompanyUser[];
  onAssignUser: (userId: string, companyId: string) => void;
  onUnassignUser: (userId: string, companyId: string) => void;
  onClose: () => void;
}

export const ManageUsersModal: React.FC<ManageUsersModalProps> = ({
  company,
  availableUsers,
  companyUsers,
  onAssignUser,
  onUnassignUser,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar usuários que já estão vinculados a esta empresa específica
  const assignedUserIds = companyUsers.map(user => user.user_id);
  const unassignedUsers = availableUsers.filter(user => 
    !assignedUserIds.includes(user.user_id)
  );
  
  const filteredUnassigned = unassignedUsers.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanyUsers = companyUsers.filter(user =>
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar Usuários - {company.name}
          </DialogTitle>
          <DialogDescription>
            Vincule ou desvincule usuários desta empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="assigned" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assigned" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Usuários da Empresa ({filteredCompanyUsers.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Usuários Disponíveis ({filteredUnassigned.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned" className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCompanyUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm 
                      ? 'Nenhum usuário encontrado na empresa.' 
                      : 'Nenhum usuário vinculado a esta empresa.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCompanyUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUnassignUser(user.user_id, company.id)}
                        >
                          <Unlink className="w-4 h-4 mr-1" />
                          Desvincular
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="available" className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm 
                      ? 'Nenhum usuário disponível encontrado.' 
                      : 'Todos os usuários já estão vinculados a empresas.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUnassigned.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserMinus className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => onAssignUser(user.user_id, company.id)}
                          disabled={user.status === 'inactive'}
                        >
                          <Link2 className="w-4 h-4 mr-1" />
                          Vincular
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};