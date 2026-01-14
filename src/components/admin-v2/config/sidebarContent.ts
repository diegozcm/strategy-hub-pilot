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
            { icon: LayoutDashboard, label: "Painel Principal", href: "/app/admin-v2", isActive: true },
            { icon: Activity, label: "Estatísticas do Sistema", href: "/app/admin-v2/dashboard/stats", hasDropdown: true, children: [
              { label: "Usuários Ativos", href: "/app/admin-v2/dashboard/stats/active-users" },
              { label: "Empresas Cadastradas", href: "/app/admin-v2/dashboard/stats/companies" },
              { label: "Logins Recentes", href: "/app/admin-v2/dashboard/stats/logins" },
            ]},
            { icon: Clock, label: "Atividade Recente", href: "/app/admin-v2/dashboard/activity" },
          ],
        },
        {
          title: "Relatórios Rápidos",
          items: [
            { icon: Users, label: "Usuários por Empresa", href: "/app/admin-v2/dashboard/users-by-company" },
            { icon: CheckCircle, label: "Status do Sistema", href: "/app/admin-v2/dashboard/system-status" },
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
            { icon: Plus, label: "Nova Empresa", href: "/app/admin-v2/companies/new" },
            { icon: Filter, label: "Filtrar Empresas", href: "/app/admin-v2/companies/filter" },
          ],
        },
        {
          title: "Gerenciamento",
          items: [
            { icon: Building2, label: "Todas as Empresas", href: "/app/admin-v2/companies", hasDropdown: true, children: [
              { label: "Empresas Ativas", href: "/app/admin-v2/companies/active" },
              { label: "Empresas Inativas", href: "/app/admin-v2/companies/inactive" },
            ]},
            { icon: Globe, label: "Startups", href: "/app/admin-v2/companies/startups", hasDropdown: true, children: [
              { label: "Startups Ativas", href: "/app/admin-v2/companies/startups/active" },
              { label: "Mentores Vinculados", href: "/app/admin-v2/companies/startups/mentors" },
            ]},
          ],
        },
        {
          title: "Outros",
          items: [
            { icon: Archive, label: "Empresas Arquivadas", href: "/app/admin-v2/companies/archived" },
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
            { icon: UserPlus, label: "Criar Usuário", href: "/app/admin-v2/users/create" },
            { icon: Filter, label: "Filtrar Usuários", href: "/app/admin-v2/users/filter" },
          ],
        },
        {
          title: "Gerenciamento",
          items: [
            { icon: Users, label: "Todos os Usuários", href: "/app/admin-v2/users", hasDropdown: true, children: [
              { label: "Usuários Ativos", href: "/app/admin-v2/users/active" },
              { label: "Usuários Inativos", href: "/app/admin-v2/users/inactive" },
            ]},
            { icon: Clock, label: "Pendentes", href: "/app/admin-v2/users/pending", hasDropdown: true, children: [
              { label: "Aguardando Aprovação", href: "/app/admin-v2/users/pending/approval" },
              { label: "Primeiro Login", href: "/app/admin-v2/users/pending/first-login" },
            ]},
            { icon: Shield, label: "Administradores do Sistema", href: "/app/admin-v2/users/admins" },
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
            { icon: Package, label: "Módulos Disponíveis", href: "/app/admin-v2/modules", hasDropdown: true, children: [
              { label: "Planejamento Estratégico", href: "/app/admin-v2/modules/strategic-planning" },
              { label: "Startup Hub", href: "/app/admin-v2/modules/startup-hub" },
              { label: "IA Copilot", href: "/app/admin-v2/modules/ai-copilot" },
            ]},
            { icon: Building2, label: "Módulos por Empresa", href: "/app/admin-v2/modules/by-company" },
          ],
        },
        {
          title: "Permissões",
          items: [
            { icon: Shield, label: "Roles e Permissões", href: "/app/admin-v2/modules/roles", hasDropdown: true, children: [
              { label: "Administrador", href: "/app/admin-v2/modules/roles/admin" },
              { label: "Gerente", href: "/app/admin-v2/modules/roles/manager" },
              { label: "Membro", href: "/app/admin-v2/modules/roles/member" },
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
            { icon: Server, label: "Saúde do Sistema", href: "/app/admin-v2/monitoring/health" },
            { icon: Activity, label: "Performance", href: "/app/admin-v2/monitoring/performance" },
            { icon: AlertCircle, label: "Alertas", href: "/app/admin-v2/monitoring/alerts", hasDropdown: true, children: [
              { label: "Erros Críticos", href: "/app/admin-v2/monitoring/alerts/critical" },
              { label: "Avisos", href: "/app/admin-v2/monitoring/alerts/warnings" },
              { label: "Informações", href: "/app/admin-v2/monitoring/alerts/info" },
            ]},
          ],
        },
        {
          title: "Logs",
          items: [
            { icon: FileText, label: "Logs de Acesso", href: "/app/admin-v2/monitoring/logs/access" },
            { icon: Database, label: "Logs de Banco de Dados", href: "/app/admin-v2/monitoring/logs/database" },
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
            { icon: Settings, label: "Configurações Gerais", href: "/app/admin-v2/settings/general" },
            { icon: Lock, label: "Segurança", href: "/app/admin-v2/settings/security", hasDropdown: true, children: [
              { label: "Políticas de Senha", href: "/app/admin-v2/settings/security/password" },
              { label: "MFA", href: "/app/admin-v2/settings/security/mfa" },
              { label: "Sessões Ativas", href: "/app/admin-v2/settings/security/sessions" },
            ]},
            { icon: Bell, label: "Notificações", href: "/app/admin-v2/settings/notifications" },
          ],
        },
        {
          title: "Dados",
          items: [
            { icon: Download, label: "Backup", href: "/app/admin-v2/settings/backup", hasDropdown: true, children: [
              { label: "Criar Backup", href: "/app/admin-v2/settings/backup/create" },
              { label: "Restaurar Backup", href: "/app/admin-v2/settings/backup/restore" },
              { label: "Agendamentos", href: "/app/admin-v2/settings/backup/schedules" },
            ]},
            { icon: Trash2, label: "Limpeza de Dados", href: "/app/admin-v2/settings/cleanup" },
          ],
        },
        {
          title: "Administradores",
          items: [
            { icon: Shield, label: "Admins do Sistema", href: "/app/admin-v2/settings/admins" },
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
            { icon: Palette, label: "Editar Conteúdo", href: "/app/admin-v2/landing/edit" },
            { icon: Eye, label: "Preview", href: "/app/admin-v2/landing/preview" },
          ],
        },
        {
          title: "Publicação",
          items: [
            { icon: Upload, label: "Publicar Alterações", href: "/app/admin-v2/landing/publish" },
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
            { icon: Mail, label: "Todos os Templates", href: "/app/admin-v2/emails", hasDropdown: true, children: [
              { label: "Boas-vindas", href: "/app/admin-v2/emails/welcome" },
              { label: "Credenciais de Acesso", href: "/app/admin-v2/emails/credentials" },
              { label: "Recuperação de Senha", href: "/app/admin-v2/emails/password-recovery" },
              { label: "Notificações", href: "/app/admin-v2/emails/notifications" },
            ]},
          ],
        },
        {
          title: "Ações",
          items: [
            { icon: Plus, label: "Novo Template", href: "/app/admin-v2/emails/new" },
            { icon: Eye, label: "Preview", href: "/app/admin-v2/emails/preview" },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.dashboard;
}
