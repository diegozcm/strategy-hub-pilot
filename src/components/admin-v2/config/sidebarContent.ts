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

export const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "companies", icon: Building2, label: "Empresas" },
  { id: "users", icon: Users, label: "Usuários" },
  { id: "modules", icon: Package, label: "Módulos" },
  { id: "monitoring", icon: Monitor, label: "Monitoramento" },
  { id: "settings", icon: Settings, label: "Configurações" },
  { id: "landing", icon: FileText, label: "Landing Page" },
  { id: "emails", icon: Mail, label: "Templates" },
] as const;

export type NavSection = typeof navItems[number]["id"];

export function getSidebarContent(activeSection: NavSection): SidebarContent {
  const contentMap: Record<NavSection, SidebarContent> = {
    dashboard: {
      title: "Dashboard",
      sections: [
        {
          title: "Visão Geral",
          items: [
            { icon: LayoutDashboard, label: "Painel Principal", isActive: true },
            { icon: Activity, label: "Estatísticas do Sistema", hasDropdown: true, children: [
              { label: "Usuários Ativos" },
              { label: "Empresas Cadastradas" },
              { label: "Logins Recentes" },
            ]},
            { icon: Clock, label: "Atividade Recente", hasDropdown: true, children: [
              { label: "Últimas 24 horas" },
              { label: "Última semana" },
              { label: "Último mês" },
            ]},
          ],
        },
        {
          title: "Relatórios Rápidos",
          items: [
            { icon: Users, label: "Usuários por Empresa" },
            { icon: CheckCircle, label: "Status do Sistema" },
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
            { icon: Plus, label: "Nova Empresa" },
            { icon: Filter, label: "Filtrar Empresas" },
          ],
        },
        {
          title: "Gerenciamento",
          items: [
            { icon: Building2, label: "Todas as Empresas", hasDropdown: true, children: [
              { label: "Empresas Ativas" },
              { label: "Empresas Inativas" },
            ]},
            { icon: Globe, label: "Startups", hasDropdown: true, children: [
              { label: "Startups Ativas" },
              { label: "Mentores Vinculados" },
            ]},
          ],
        },
        {
          title: "Outros",
          items: [
            { icon: Archive, label: "Empresas Arquivadas" },
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
            { icon: UserPlus, label: "Criar Usuário" },
            { icon: Filter, label: "Filtrar Usuários" },
          ],
        },
        {
          title: "Gerenciamento",
          items: [
            { icon: Users, label: "Todos os Usuários", hasDropdown: true, children: [
              { label: "Usuários Ativos" },
              { label: "Usuários Inativos" },
            ]},
            { icon: Clock, label: "Pendentes", hasDropdown: true, children: [
              { label: "Aguardando Aprovação" },
              { label: "Primeiro Login" },
            ]},
            { icon: Shield, label: "Administradores do Sistema" },
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
            { icon: Package, label: "Módulos Disponíveis", hasDropdown: true, children: [
              { label: "Planejamento Estratégico" },
              { label: "Startup Hub" },
              { label: "IA Copilot" },
            ]},
            { icon: Building2, label: "Módulos por Empresa" },
          ],
        },
        {
          title: "Permissões",
          items: [
            { icon: Shield, label: "Roles e Permissões", hasDropdown: true, children: [
              { label: "Administrador" },
              { label: "Gerente" },
              { label: "Membro" },
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
            { icon: Server, label: "Saúde do Sistema" },
            { icon: Activity, label: "Performance" },
            { icon: AlertCircle, label: "Alertas", hasDropdown: true, children: [
              { label: "Erros Críticos" },
              { label: "Avisos" },
              { label: "Informações" },
            ]},
          ],
        },
        {
          title: "Logs",
          items: [
            { icon: FileText, label: "Logs de Acesso" },
            { icon: Database, label: "Logs de Banco de Dados" },
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
            { icon: Settings, label: "Configurações Gerais" },
            { icon: Lock, label: "Segurança", hasDropdown: true, children: [
              { label: "Políticas de Senha" },
              { label: "MFA" },
              { label: "Sessões Ativas" },
            ]},
            { icon: Bell, label: "Notificações" },
          ],
        },
        {
          title: "Dados",
          items: [
            { icon: Download, label: "Backup", hasDropdown: true, children: [
              { label: "Criar Backup" },
              { label: "Restaurar Backup" },
              { label: "Agendamentos" },
            ]},
            { icon: Trash2, label: "Limpeza de Dados" },
          ],
        },
        {
          title: "Administradores",
          items: [
            { icon: Shield, label: "Admins do Sistema" },
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
            { icon: Palette, label: "Editar Conteúdo" },
            { icon: Eye, label: "Preview" },
          ],
        },
        {
          title: "Publicação",
          items: [
            { icon: Upload, label: "Publicar Alterações" },
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
            { icon: Mail, label: "Todos os Templates", hasDropdown: true, children: [
              { label: "Boas-vindas" },
              { label: "Credenciais de Acesso" },
              { label: "Recuperação de Senha" },
              { label: "Notificações" },
            ]},
          ],
        },
        {
          title: "Ações",
          items: [
            { icon: Plus, label: "Novo Template" },
            { icon: Eye, label: "Preview" },
          ],
        },
      ],
    },
  };

  return contentMap[activeSection] || contentMap.dashboard;
}
