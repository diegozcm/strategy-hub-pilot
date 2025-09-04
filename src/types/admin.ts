export interface Company {
  id: string;
  name: string;
  owner_id: string;
  mission?: string;
  vision?: string;
  values?: string[];
  logo_url?: string;
  status: 'active' | 'inactive';
  company_type?: 'regular' | 'startup';
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  user_id: string;
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'pending';
  company_id?: string;
  company_name?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'pending';
  department?: string;
  position?: string;
  created_at: string;
  updated_at: string;
}