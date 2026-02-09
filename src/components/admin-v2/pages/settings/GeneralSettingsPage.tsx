import { useState, useEffect } from "react";
import { Settings, Globe, Bell, Users, Shield, Loader2, Save } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string | null;
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("category");

      if (error) throw error;

      const map: Record<string, SystemSetting> = {};
      data?.forEach((s) => {
        map[s.key] = s;
      });
      setSettings(map);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const getValue = (key: string, fallback: any = "") => {
    return settings[key]?.value ?? fallback;
  };

  const updateLocalValue = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const setting of Object.values(settings)) {
        await supabase
          .from("system_settings")
          .update({ value: setting.value as any, updated_by: user?.id || null })
          .eq("id", setting.id);
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageContainer title="Configurações Gerais" description="Configurações globais do sistema">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer title="Configurações Gerais" description="Configurações globais do sistema">
      <div className="max-w-3xl space-y-6">
        {/* Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Geral
            </CardTitle>
            <CardDescription>Nome do sistema e modo de manutenção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Aplicação</Label>
              <Input
                value={String(getValue("app_name", ""))}
                onChange={(e) => updateLocalValue("app_name", e.target.value)}
                placeholder="Nome do sistema"
              />
              <p className="text-xs text-muted-foreground">
                {settings["app_name"]?.description}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  {settings["maintenance_mode"]?.description}
                </p>
              </div>
              <Switch
                checked={getValue("maintenance_mode", false) === true || getValue("maintenance_mode", false) === "true"}
                onCheckedChange={(checked) => updateLocalValue("maintenance_mode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registros
            </CardTitle>
            <CardDescription>Controle de registro de empresas e usuários</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Registro de Empresas</Label>
                <p className="text-sm text-muted-foreground">
                  {settings["company_registration_enabled"]?.description}
                </p>
              </div>
              <Switch
                checked={getValue("company_registration_enabled", true) === true || getValue("company_registration_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalValue("company_registration_enabled", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Registro de Usuários</Label>
                <p className="text-sm text-muted-foreground">
                  {settings["user_registration_enabled"]?.description}
                </p>
              </div>
              <Switch
                checked={getValue("user_registration_enabled", true) === true || getValue("user_registration_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalValue("user_registration_enabled", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Limites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Limites e Segurança
            </CardTitle>
            <CardDescription>Limites de uso e configurações de segurança</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Máximo de Usuários por Empresa</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={String(getValue("max_users_per_company", 100))}
                onChange={(e) => updateLocalValue("max_users_per_company", Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                {settings["max_users_per_company"]?.description}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Timeout de Sessão (minutos)</Label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={String(getValue("session_timeout_minutes", 60))}
                onChange={(e) => updateLocalValue("session_timeout_minutes", Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                {settings["session_timeout_minutes"]?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configurações de notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Notificações por E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  {settings["email_notifications_enabled"]?.description}
                </p>
              </div>
              <Switch
                checked={getValue("email_notifications_enabled", true) === true || getValue("email_notifications_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalValue("email_notifications_enabled", checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>E-mail de Notificação Admin</Label>
              <Input
                type="email"
                value={String(getValue("admin_notification_email", ""))}
                onChange={(e) => updateLocalValue("admin_notification_email", e.target.value)}
                placeholder="admin@empresa.com"
              />
              <p className="text-xs text-muted-foreground">
                {settings["admin_notification_email"]?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Manutenção
            </CardTitle>
            <CardDescription>Configurações de backup e manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Frequência de Backup (horas)</Label>
              <Input
                type="number"
                min={1}
                max={720}
                value={String(getValue("backup_frequency_hours", 24))}
                onChange={(e) => updateLocalValue("backup_frequency_hours", Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                {settings["backup_frequency_hours"]?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </AdminPageContainer>
  );
}
