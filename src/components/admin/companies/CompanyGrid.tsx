import React from 'react';
import { Card } from '@/components/ui/card';
import { CompanyCard } from './CompanyCard';

interface Company {
  id: string;
  name: string;
  owner_id: string;
  mission?: string;
  vision?: string;
  values?: string[];
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface CompanyUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive';
  company_id?: string;
}

interface CompanyGridProps {
  companies: Company[];
  companyUsers: { [key: string]: CompanyUser[] };
  onEdit: (company: Company) => void;
  onToggleStatus: (companyId: string, currentStatus: string) => void;
  onManageUsers: (company: Company) => void;
}

export const CompanyGrid: React.FC<CompanyGridProps> = ({
  companies,
  companyUsers,
  onEdit,
  onToggleStatus,
  onManageUsers
}) => {
  return (
    <div className="space-y-6">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          users={companyUsers[company.id] || []}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onManageUsers={onManageUsers}
        />
      ))}
    </div>
  );
};