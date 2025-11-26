import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCompanyModuleSettings } from '@/hooks/useCompanyModuleSettings';
import { Loader2 } from 'lucide-react';

export const ModulesSettingsTab: React.FC = () => {
  const strategySettings = useCompanyModuleSettings('strategic-planning');
  const startupSettings = useCompanyModuleSettings('startup-hub');

  return (
    <Tabs defaultValue="strategy-hub" className="w-full">
      <TabsList>
        <TabsTrigger value="strategy-hub">Strategy HUB</TabsTrigger>
        <TabsTrigger value="startup-hub">Startup HUB</TabsTrigger>
      </TabsList>

      <TabsContent value="strategy-hub">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Strategy HUB</CardTitle>
            <CardDescription>
              Configurações específicas para o módulo Strategy HUB
            </CardDescription>
          </CardHeader>
          <CardContent>
            {strategySettings.loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="strategy-validity">Vigência</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar controle de vigência para esta empresa
                  </p>
                </div>
                <Switch
                  id="strategy-validity"
                  checked={strategySettings.validityEnabled}
                  onCheckedChange={strategySettings.toggleValidity}
                  disabled={strategySettings.isUpdating}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="startup-hub">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Startup HUB</CardTitle>
            <CardDescription>
              Configurações específicas para o módulo Startup HUB
            </CardDescription>
          </CardHeader>
          <CardContent>
            {startupSettings.loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="startup-validity">Vigência</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar controle de vigência para esta empresa
                  </p>
                </div>
                <Switch
                  id="startup-validity"
                  checked={startupSettings.validityEnabled}
                  onCheckedChange={startupSettings.toggleValidity}
                  disabled={startupSettings.isUpdating}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
