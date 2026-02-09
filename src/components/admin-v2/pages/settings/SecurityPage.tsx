import { useState } from "react";
import { Shield, Lock, Key, Smartphone, Clock, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function SecurityPage() {
  const navigate = useNavigate();

  const { data: passwordPolicy, isLoading: policyLoading } = useQuery({
    queryKey: ["security-password-policy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("password_policies")
        .select("*")
        .is("company_id", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: sessionSetting } = useQuery({
    queryKey: ["security-session-timeout"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "session_timeout_minutes")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: adminCount } = useQuery({
    queryKey: ["security-admin-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if (error) throw error;
      return count || 0;
    },
  });

  const securityItems = [
    {
      icon: Lock,
      title: "Políticas de Senha",
      description: passwordPolicy
        ? `Mín. ${passwordPolicy.min_password_length} chars${passwordPolicy.require_uppercase ? ", maiúscula" : ""}${passwordPolicy.require_number ? ", número" : ""}${passwordPolicy.require_special_char ? ", especial" : ""}`
        : "Não configurada",
      status: passwordPolicy ? "configured" : "warning",
      action: () => navigate("/app/admin-v2/settings/password-policies"),
      actionLabel: "Configurar",
    },
    {
      icon: Key,
      title: "Senha Temporária",
      description: passwordPolicy
        ? passwordPolicy.temp_password_validity_hours === 0
          ? "Sem expiração (risco)"
          : `Expira em ${passwordPolicy.temp_password_validity_hours}h`
        : "Não configurada",
      status: passwordPolicy?.temp_password_validity_hours === 0 ? "warning" : passwordPolicy ? "configured" : "warning",
      action: () => navigate("/app/admin-v2/settings/password-policies"),
      actionLabel: "Configurar",
    },
    {
      icon: Smartphone,
      title: "Autenticação MFA",
      description: "Autenticação de dois fatores",
      status: "info",
      action: () => navigate("/app/admin-v2/settings/mfa"),
      actionLabel: "Gerenciar",
    },
    {
      icon: Clock,
      title: "Timeout de Sessão",
      description: sessionSetting ? `${sessionSetting.value} minutos` : "60 minutos",
      status: "configured",
      action: () => navigate("/app/admin-v2/settings/general"),
      actionLabel: "Alterar",
    },
    {
      icon: Shield,
      title: "Admins do Sistema",
      description: `${adminCount ?? "..."} administradores`,
      status: (adminCount ?? 0) > 0 ? "configured" : "warning",
      action: () => navigate("/app/admin-v2/settings/system-admins"),
      actionLabel: "Gerenciar",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "configured":
        return <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10"><CheckCircle className="h-3 w-3 mr-1" />Configurado</Badge>;
      case "warning":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Atenção</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <AdminPageContainer title="Segurança" description="Visão geral das configurações de segurança">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Painel de Segurança
            </CardTitle>
            <CardDescription>
              Resumo de todas as configurações de segurança do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {policyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {securityItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(item.status)}
                        <Button variant="ghost" size="sm" onClick={item.action}>
                          {item.actionLabel}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    {idx < securityItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/app/admin-v2/settings/active-sessions")}>
              <Clock className="h-4 w-4 mr-2" />
              Ver Sessões Ativas
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/admin-v2/settings/password-policies")}>
              <Lock className="h-4 w-4 mr-2" />
              Políticas de Senha
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/admin-v2/settings/system-admins")}>
              <Shield className="h-4 w-4 mr-2" />
              Admins do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminPageContainer>
  );
}
