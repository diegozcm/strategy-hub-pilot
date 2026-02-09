import { useState, useEffect } from "react";
import { Bell, Mail, Loader2, Save, AlertTriangle, MessageSquare } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationSettings {
  email_notifications_enabled: boolean;
  admin_notification_email: string;
  notify_new_user: boolean;
  notify_new_company: boolean;
  notify_backup_complete: boolean;
  notify_system_errors: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email_notifications_enabled: true,
  admin_notification_email: "",
  notify_new_user: true,
  notify_new_company: true,
  notify_backup_complete: true,
  notify_system_errors: true,
};

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "email_notifications_enabled",
          "admin_notification_email",
          "notify_new_user",
          "notify_new_company",
          "notify_backup_complete",
          "notify_system_errors",
        ]);

      if (error) throw error;

      const mapped: Record<string, any> = {};
      data?.forEach((s) => {
        mapped[s.key] = s.value;
      });

      setSettings({
        email_notifications_enabled:
          mapped.email_notifications_enabled === true || mapped.email_notifications_enabled === "true" || DEFAULT_SETTINGS.email_notifications_enabled,
        admin_notification_email:
          typeof mapped.admin_notification_email === "string" ? mapped.admin_notification_email : DEFAULT_SETTINGS.admin_notification_email,
        notify_new_user:
          mapped.notify_new_user === true || mapped.notify_new_user === "true" || (mapped.notify_new_user === undefined && DEFAULT_SETTINGS.notify_new_user),
        notify_new_company:
          mapped.notify_new_company === true || mapped.notify_new_company === "true" || (mapped.notify_new_company === undefined && DEFAULT_SETTINGS.notify_new_company),
        notify_backup_complete:
          mapped.notify_backup_complete === true || mapped.notify_backup_complete === "true" || (mapped.notify_backup_complete === undefined && DEFAULT_SETTINGS.notify_backup_complete),
        notify_system_errors:
          mapped.notify_system_errors === true || mapped.notify_system_errors === "true" || (mapped.notify_system_errors === undefined && DEFAULT_SETTINGS.notify_system_errors),
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar configurações de notificação");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const entries = Object.entries(settings);

      for (const [key, value] of entries) {
        // Try update first
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ value: value as any, updated_by: user?.id })
            .eq("key", key);
        } else {
          await supabase.from("system_settings").insert({
            key,
            value: value as any,
            category: "notifications",
            description: `Configuração de notificação: ${key}`,
            updated_by: user?.id,
          });
        }
      }

      toast.success("Configurações de notificação salvas!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageContainer title="Notificações" description="Configurações › Sistema › Notificações">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer title="Notificações" description="Configurações › Sistema › Notificações">
      <div className="max-w-3xl space-y-6">
        {/* Master toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notificações por E-mail
            </CardTitle>
            <CardDescription>Ative ou desative as notificações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Ativar Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Controle global de envio de e-mails pelo sistema
                </p>
              </div>
              <Switch
                checked={settings.email_notifications_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, email_notifications_enabled: checked }))
                }
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>E-mail do Administrador</Label>
              <Input
                type="email"
                placeholder="admin@empresa.com"
                value={settings.admin_notification_email}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, admin_notification_email: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                E-mail que receberá as notificações administrativas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Event notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Eventos de Notificação
            </CardTitle>
            <CardDescription>Escolha quais eventos disparam notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              {
                key: "notify_new_user" as const,
                label: "Novo Usuário Registrado",
                desc: "Notificar quando um novo usuário se registrar no sistema",
                icon: <MessageSquare className="h-4 w-4" />,
              },
              {
                key: "notify_new_company" as const,
                label: "Nova Empresa Criada",
                desc: "Notificar quando uma nova empresa for criada",
                icon: <MessageSquare className="h-4 w-4" />,
              },
              {
                key: "notify_backup_complete" as const,
                label: "Backup Concluído",
                desc: "Notificar quando um backup for concluído com sucesso",
                icon: <MessageSquare className="h-4 w-4" />,
              },
              {
                key: "notify_system_errors" as const,
                label: "Erros do Sistema",
                desc: "Notificar sobre erros críticos do sistema",
                icon: <AlertTriangle className="h-4 w-4" />,
              },
            ].map((item, idx, arr) => (
              <div key={item.key}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[item.key]}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, [item.key]: checked }))
                    }
                    disabled={!settings.email_notifications_enabled}
                  />
                </div>
                {idx < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {!settings.email_notifications_enabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              As notificações por e-mail estão <strong>desativadas</strong>. Ative o switch principal para configurar os eventos.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </AdminPageContainer>
  );
}
