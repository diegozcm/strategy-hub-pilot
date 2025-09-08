import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Save,
  RotateCcw,
  Shield,
  Bell,
  Users,
  Server,
  Database,
  Clock,
  Key,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { DatabaseCleanupTab } from './DatabaseCleanupTab';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface SettingGroup {
  [key: string]: SystemSetting[];
}

export const SystemSettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingGroup>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<{[key: string]: any}>({});

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;

      // Group settings by category
      const groupedSettings: SettingGroup = {};
      data?.forEach((setting) => {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = [];
        }
        groupedSettings[setting.category].push(setting);
      });

      setSettings(groupedSettings);
      
      // Initialize edited settings
      const initialEdited: {[key: string]: any} = {};
      data?.forEach((setting) => {
        initialEdited[setting.key] = setting.value;
      });
      setEditedSettings(initialEdited);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações do sistema',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Prepare updates
      const updates = Object.entries(editedSettings).map(([key, value]) => ({
        key,
        value,
        updated_by: user.id
      }));

      // Update each setting
      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            value: update.value,
            updated_by: update.updated_by,
            updated_at: new Date().toISOString()
          })
          .eq('key', update.key);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso'
      });

      await loadSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    await loadSettings();
    toast({
      title: 'Configurações Recarregadas',
      description: 'As configurações foram recarregadas do banco de dados'
    });
  };

  const updateSetting = (key: string, value: any) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'notifications': return <Bell className="h-4 w-4" />;
      case 'registration': return <Users className="h-4 w-4" />;
      case 'limits': return <Server className="h-4 w-4" />;
      case 'maintenance': return <Database className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'general': return 'Geral';
      case 'security': return 'Segurança';
      case 'notifications': return 'Notificações';
      case 'registration': return 'Registro';
      case 'limits': return 'Limites';
      case 'maintenance': return 'Manutenção';
      default: return category;
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = editedSettings[setting.key];
    
    // Tratamento especial para email de notificação do admin
    if (setting.key === 'admin_notification_email') {
      const emailValue = typeof value === 'string' ? value : (typeof value === 'object' && value !== null ? JSON.stringify(value).replace(/"/g, '') : '');
      return (
        <Input
          type="email"
          value={emailValue}
          onChange={(e) => updateSetting(setting.key, e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          placeholder="admin@empresa.com"
        />
      );
    }
    
    if (typeof value === 'boolean') {
      return (
        <Switch
          checked={value}
          onCheckedChange={(checked) => updateSetting(setting.key, checked)}
        />
      );
    }
    
    if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => updateSetting(setting.key, Number(e.target.value))}
          className="bg-slate-700 border-slate-600 text-white"
        />
      );
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <Textarea
          value={value}
          onChange={(e) => updateSetting(setting.key, e.target.value)}
          className="bg-slate-700 border-slate-600 text-white"
          rows={3}
        />
      );
    }
    
    return (
      <Input
        value={value || ''}
        onChange={(e) => updateSetting(setting.key, e.target.value)}
        className="bg-slate-700 border-slate-600 text-white"
      />
    );
  };

  if (!isAdmin) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-white">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
            <p className="text-slate-400">Você não tem permissão para acessar as configurações do sistema.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <p className="text-slate-400 mt-4">Carregando configurações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Settings className="h-5 w-5" />
                <span>Configurações do Sistema</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gerencie as configurações globais do sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetSettings} disabled={saving}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-slate-600 text-white"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações do Sistema</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="cleanup"
                className="data-[state=active]:bg-slate-600 text-white"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpeza de Dados</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              {/* Seção de Tema */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Settings className="h-4 w-4" />
                    <span>Tema do Sistema</span>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure o tema visual do sistema administrativo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-white">
                        Seletor de Tema
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">
                        Escolha entre tema claro, escuro ou automático
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue={Object.keys(settings)[0]} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-slate-700">
                  {Object.keys(settings).map((category) => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="data-[state=active]:bg-slate-600 text-white"
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="hidden sm:inline">{getCategoryTitle(category)}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(settings).map(([category, categorySettings]) => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    <div className="grid gap-6">
                      {categorySettings.map((setting) => (
                        <div key={setting.key} className="space-y-4 p-4 border border-slate-600 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-white">
                                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <p className="text-xs text-slate-400">{setting.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryTitle(setting.category)}
                            </Badge>
                          </div>
                          
                          <div className="max-w-md">
                            {renderSettingInput(setting)}
                          </div>
                          
                          <div className="text-xs text-slate-500">
                            Última atualização: {new Date(setting.updated_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            <TabsContent value="cleanup" className="space-y-6">
              <DatabaseCleanupTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};