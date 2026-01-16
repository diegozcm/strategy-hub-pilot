import React, { useState } from 'react';
import { AdminPageContainer } from '../../components/AdminPageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCompaniesForSelect } from '@/hooks/admin/useUsersStats';
import { ArrowLeft, User, Building2, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateUserPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: companies, isLoading: companiesLoading } = useCompaniesForSelect();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', companyId: '', department: '', position: '',
    passwordType: 'auto', manualPassword: '', sendCredentials: true, forcePasswordChange: true
  });

  const handleNotImplemented = () => {
    toast({ title: "Funcionalidade em Desenvolvimento", description: "A criação de usuários será implementada em breve." });
  };

  return (
    <AdminPageContainer title="Criar Usuário" description="Adicione um novo usuário ao sistema">
      <Button variant="ghost" className="mb-4" onClick={() => navigate('/app/admin-v2/users')}>
        <ArrowLeft className="h-4 w-4 mr-2" />Voltar para Usuários
      </Button>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" />Informações Básicas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome *</Label><Input placeholder="Digite o nome" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Sobrenome *</Label><Input placeholder="Digite o sobrenome" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="email@empresa.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5" />Empresa e Acesso</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Empresa</Label>
              <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                <SelectContent>{companiesLoading ? <SelectItem value="loading" disabled>Carregando...</SelectItem> : companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Departamento</Label><Input placeholder="Ex: Tecnologia" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input placeholder="Ex: Desenvolvedor" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Key className="h-5 w-5" />Credenciais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={formData.passwordType} onValueChange={(value) => setFormData({ ...formData, passwordType: value })}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="auto" id="auto" /><Label htmlFor="auto">Gerar senha temporária automaticamente</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="manual" id="manual" /><Label htmlFor="manual">Definir senha manualmente</Label></div>
            </RadioGroup>
            {formData.passwordType === 'manual' && <div className="space-y-2"><Label>Senha</Label><Input type="password" placeholder="Digite a senha" value={formData.manualPassword} onChange={(e) => setFormData({ ...formData, manualPassword: e.target.value })} /></div>}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2"><Checkbox id="sendCredentials" checked={formData.sendCredentials} onCheckedChange={(checked) => setFormData({ ...formData, sendCredentials: checked as boolean })} /><Label htmlFor="sendCredentials" className="font-normal">Enviar credenciais por email</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="forcePasswordChange" checked={formData.forcePasswordChange} onCheckedChange={(checked) => setFormData({ ...formData, forcePasswordChange: checked as boolean })} /><Label htmlFor="forcePasswordChange" className="font-normal">Obrigar troca de senha no primeiro login</Label></div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => navigate('/app/admin-v2/users')}>Cancelar</Button><Button onClick={handleNotImplemented}>Criar Usuário</Button></div>
      </div>
    </AdminPageContainer>
  );
}
