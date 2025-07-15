import React from 'react';
import { Card } from '@/components/ui/card';
import { CompanyCard } from './CompanyCard';
import { Company, CompanyUser } from '@/types/admin';

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