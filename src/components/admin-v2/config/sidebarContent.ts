import { LucideIcon, LayoutDashboard, Building2, Users, Package, Monitor, Settings, FileText, Mail, Plus, Filter, Clock, CheckCircle, AlertCircle, Archive, UserPlus, Shield, Database, Trash2, Eye, Activity, Server, Bell, Lock, Download, Upload, Palette, Globe } from "lucide-react";

export interface MenuItemT {
  icon?: LucideIcon;
  label: string;
  hasDropdown?: boolean;
  isActive?: boolean;
  href?: string;
  children?: MenuItemT[];
}

export interface MenuSectionT {
  title: string;
  items: MenuItemT[];
}

export interface SidebarContent {
  title: string;
  sections: MenuSectionT[];
}

// Settings removed from here - it's in the bottom section of IconNavigation
export const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "companies", icon: Building2, label: "Empresas" },
  { id: "users", icon: Users, label: "Usuários" },
  { id: "modules", icon: Package, label: "Módulos" },
  { id: "monitoring", icon: Monitor, label: "Monitoramento" },
  { id: "landing", icon: FileText, label: "Landing Page" },
  { id: "emails", icon: Mail, label: "Templates" },
] as const;

export type NavSection = (typeof navItems)[number]["id"] | "settings";

export function getSidebarContent(activeSection: NavSection): SidebarContent {
  const contentMap: Record<NavSection, SidebarContent> = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Visão Geral",
          items: [
            { icon: LayoutDashboard, label: "Painel Principal", href: "/app/admin", isActive: true },
            { icon: Activity, label: "Estatísticas do Sistema", href: "/app/admin/dashboard/stats", hasDropdown: true, children: [
              { label: "Usuários Ativos", href: "/app/admin/dashboard/stats/active-users" },
              { label: "Empresas Cadastradas", href: "/app/admin/dashboard/stats/companies" },
              { label: "Logins Recentes", href: "/app/admin/dashboard/stats/logins" },
            ]},
            { icon: Clock, label: "Atividade Recente", href: "/app/admin/dashboard/activity" },
          ],
        },
        {
          title: "Relatórios Rápidos",
          items: [
            { icon: Users, label: "Usuários por Empresa", href: "/app/admin/dashboard/users-by-company" },
            { icon: CheckCircle, label: "Status do Sistema", href: "/app/admin/dashboard/system-status" },
          ],
        },
      ],
    },

    companies: {
      title: "Empresas",
      sections: [
        {
          title: "Ações Rápidas",
          items: [
            { icon: Plus, label: "Nova Empresa", href: "/app/admin/companies/new" },
            { icon: Filter, label: "Filtrar Empresas", href: "/app/admin/companies/filter" },
          ],
        },
        {
          title: "Gerenciamento",
          items: [
            { icon: Building2, label: "Todas as Empresas", href: "/app/admin/companies", hasDropdown: true, children: [
              { label: "Empresas Ativas", href: "/app/admin/companies/active" },
              { label: "Empresas Inativas", href: "/app/admin/companies/inactive" },
            ]},
            { icon: Globe, label: "Startups", href: "/app/admin/companies/startups", hasDropdown: true, children: [
              { label: "Startups Ativas", href: "/app/admin/companies/startups/active" },
              { label: "Mentores Vinculados", href: "/app/admin/companies/startups/mentors" },
            ]},
          ],
        },
        {
          title: "Outros",
          items: [
            { icon: Archive, label: "Empresas Arquivadas", href: "/app/admin/companies/archived" },
          ],
        },
      ],
    },

    users: {
      title: "Usuários",
      sections: [
        {
          title: "Ações Rápidas",
          items: [
            { icon: UserPlus, label: "Criar Usuário", href: "/app/admin/users/create" },
            { icon: Filter, label: "Filtrar Usuários", href: "/app/admin/users/filter" },
          ],
        },
        {
          title: "Gerenciamento",
          items: [
            { icon: Users, label: "Todos os Usuários", href: "/app/admin/users", hasDropdown: true, children: [
              { label: "Usuários Ativos", href: "/app/admin/users/active" },
              { label: "Usuários Inativos", href: "/app/admin/users/inactive" },
            ]},
            { icon: Clock, label: "Pendentes", href: "/app/admin/users/pending", hasDropdown: true, children: [
              { label: "Aguardando Aprovação", href: "/app/admin/users/pending/approval" },
              { label: "Primeiro Login", href: "/app/admin/users/pending/first-login" },
            ]},
            { icon: Shield, label: "Administradores do Sistema", href: "/app/admin/users/admins" },
          ],
        },
      ],
    },

    modules: {
      title: "Módulos",
      sections: [
        {
          title: "Configuração",
          items: [
            { icon: Package, label: "Módulos Disponíveis", href: "/app/admin/modules", hasDropdown: true, children: [
              { label: "Planejamento Estratégico", href: "/app/admin/modules/strategic-planning" },
              { label: "Startup Hub", href: "/app/admin/modules/startup-hub" },
              { label: "Atlas Hub", href: "/app/admin/modules/ai-copilot" },
            ]},
            { icon: Building2, label: "Módulos por Empresa", href: "/app/admin/modules/by-company" },
          ],
        },
        {
          title: "Permissões",
          items: [
            { icon: Shield, label: "Roles e Permissões", href: "/app/admin/modules/roles", hasDropdown: true, children: [
              { label: "Administrador", href: "/app/admin/modules/roles/admin" },
              { label: "Gerente", href: "/app/admin/modules/roles/manager" },
              { label: "Membro", href: "/app/admin/modules/roles/member" },
            ]},
          ],
        },
      ],
    },

    monitoring: {
      title: "Monitoramento",
      sections: [
        {
          title: "Sistema",
          items: [
            { icon: Server, label: "Saúde do Sistema", href: "/app/admin/monitoring/health" },
            { icon: Activity, label: "Performance", href: "/app/admin/monitoring/performance" },
            { icon: AlertCircle, label: "Alertas", href: "/app/admin/monitoring/alerts", hasDropdown: true, children: [
              { label: "Erros Críticos", href: "/app/admin/monitoring/alerts/critical" },
              { label: "Avisos", href: "/app/admin/monitoring/alerts/warnings" },
              { label: "Informações", href: "/app/admin/monitoring/alerts/info" },
            ]},
          ],
        },
        {
          title: "Logs",
          items: [
            { icon: FileText, label: "Logs de Acesso", href: "/app/admin/monitoring/logs/access" },
            { icon: Database, label: "Logs de Banco de Dados", href: "/app/admin/monitoring/logs/database" },
          ],
        },
      ],
    },

    settings: {
      title: "Configurações",
      sections: [
        {
          title: "Sistema",
          items: [
            { icon: Settings, label: "Configurações Gerais", href: "/app/admin/settings/general" },
            { icon: Lock, label: "Segurança", href: "/app/admin/settings/security", hasDropdown: true, children: [
              { label: "Políticas de Senha", href: "/app/admin/settings/security/password" },
              { label: "MFA", href: "/app/admin/settings/security/mfa" },
              { label: "Sessões Ativas", href: "/app/admin/settings/security/sessions" },
            ]},
            { icon: Bell, label: "Notificações", href: "/app/admin/settings/notifications" },
          ],
        },
        {
          title: "Dados",
          items: [
            { icon: Download, label: "Backup", href: "/app/admin/settings/backup", hasDropdown: true, children: [
              { label: "Criar Backup", href: "/app/admin/settings/backup/create" },
              { label: "Restaurar Backup", href: "/app/admin/settings/backup/restore" },
              { label: "Agendamentos", href: "/app/admin/settings/backup/schedules" },
            ]},
            { icon: Trash2, label: "Limpeza de Dados", href: "/app/admin/settings/cleanup" },
          ],
        },
        {
          title: "Administradores",
          items: [
            { icon: Shield, label: "Admins do Sistema", href: "/app/admin/settings/admins" },
          ],
        },
      ],
    },

    landing: {
      title: "Landing Page",
      sections: [
        {
          title: "Editor",
          items: [
            { icon: Palette, label: "Editar Conteúdo", href: "/app/admin/landing/edit" },
            { icon: Eye, label: "Preview", href: "/app/admin/landing/preview" },
          ],
        },
        {
          title: "Publicação",
          items: [
            { icon: Upload, label: "Publicar Alterações", href: "/app/admin/landing/publish" },
          ],
        },
      ],
    },

    emails: {
      title: "Templates de Email",
      sections: [
        {
          title: "Templates",
          items: [
            { icon: Mail, label: "Todos os Templates", href: "/app/admin/emails", hasDropdown: true, children: [
              { label: "Boas-vindas", href: "/app/admin/emails/welcome" },
              { label: "Credenciais de Acesso", href: "/app/admin/emails/credentials" },
              { label: "Recuperação de Senha", href: "/app/admin/emails/password-recovery" },
              { label: "Notificações", href: "/app/admin/emails/notifications" },
            ]},
          ],
        },
        {
          title: "Ações",
          items: [
            { icon: Plus, label: "Novo Template", href: "/app/admin/emails/new" },
            { icon: Eye, label: "Preview", href: "/app/admin/emails/preview" },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.dashboard;
}
