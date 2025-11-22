import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OKRYear } from '@/types/okr';
import { useOKRPermissions } from '@/hooks/useOKRPermissions';
import { useOKRYears } from '@/hooks/useOKRYears';
import { OKRYearFormModal } from './OKRYearFormModal';

interface OKRYearSelectorProps {
  years: OKRYear[];
  currentYear: OKRYear | null;
  onYearChange: (year: OKRYear) => void;
  loading?: boolean;
}

export const OKRYearSelector: React.FC<OKRYearSelectorProps> = ({
  years,
  currentYear,
  onYearChange,
  loading,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { canCreateYear } = useOKRPermissions();
  const { fetchYears } = useOKRYears();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Ano OKR:</span>
      </div>
      
      <Select
        value={currentYear?.id || ''}
        onValueChange={(value) => {
          const year = years.find(y => y.id === value);
          if (year) onYearChange(year);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year.id} value={year.id}>
              {year.year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canCreateYear && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Ano
        </Button>
      )}

      <OKRYearFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchYears();
        }}
      />
    </div>
  );
};
