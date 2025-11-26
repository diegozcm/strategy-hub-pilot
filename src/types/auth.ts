export type UserRole = 'admin' | 'manager' | 'member';

export type UserStatus = 'pending' | 'active' | 'inactive';

export type CompanyType = 'regular' | 'startup';

export interface Company {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  active: boolean;
  ai_enabled?: boolean;
  company_type?: CompanyType;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  company_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  bio?: string;
  skills?: string[];
  hire_date?: string;
  approved_by?: string;
  approved_at?: string;
  current_module_id?: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Permission {
  read: boolean;
  write: boolean;
  delete: boolean;
  admin?: boolean;
}

export interface ImpersonationSession {
  id: string;
  admin_user_id: string;
  impersonated_user_id: string;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
}

export interface AuthContextType {
  user: any;
  session: any;
  profile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  
  /**
   * @deprecated Global permissions are deprecated. Use module-specific hooks instead:
   * - useCurrentModuleRole() for current module permissions
   * - useModulePermissions() for advanced module permission checks
   * - useIsSystemAdmin() for system admin checks
   */
  permissions: Permission;
  
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInNormalUser?: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  
  /**
   * @deprecated Use useCurrentModuleRole() for module-specific permissions.
   * These now only return true for system admins.
   */
  canEdit: boolean;
  /**
   * @deprecated Use useCurrentModuleRole() for module-specific permissions.
   * These now only return true for system admins.
   */
  canDelete: boolean;
  /**
   * @deprecated Use useCurrentModuleRole() for module-specific permissions.
   * These now only return true for system admins.
   */
  canAdmin: boolean;
  
  /**
   * True if user is a system administrator (checked via is_system_admin() database function).
   * For module-specific admin checks, use useCurrentModuleRole().isModuleAdmin
   */
  isSystemAdmin: boolean;
  
  /**
   * @deprecated Use useIsSystemAdmin() hook instead. This now returns the same value as isSystemAdmin.
   */
  isCompanyAdmin: boolean;
  
  switchCompany?: (companyId: string) => Promise<void>;
  clearCompanySelection?: (reason?: string) => void;
  fetchCompaniesByType?: (companyType: 'startup' | 'regular') => Promise<any[]>;
  fetchAllUserCompanies?: () => Promise<any[]>;
  // Impersonation features
  isImpersonating: boolean;
  originalAdmin?: UserProfile;
  impersonationSession?: ImpersonationSession;
  startImpersonation?: (userId: string) => Promise<{ error: any }>;
  endImpersonation?: () => Promise<{ error: any }>;
}