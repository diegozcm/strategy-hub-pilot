import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoldenCircleTab } from './GoldenCircleTab';
import { SwotAnalysisTab } from './SwotAnalysisTab';
import { useAuth } from '@/hooks/useMultiTenant';
import { NoCompanyMessage } from '@/components/NoCompanyMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const ToolsPage: React.FC = () => {
  const { company: selectedCompany, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedCompany) {
    return <NoCompanyMessage />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Ferramentas
        </h1>
        <p className="text-muted-foreground">
          Ferramentas estratégicas para análise e planejamento empresarial
        </p>
      </div>

      <Tabs defaultValue="golden-circle" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="golden-circle">Golden Circle</TabsTrigger>
          <TabsTrigger value="swot">Análise SWOT</TabsTrigger>
        </TabsList>
        
        <TabsContent value="golden-circle" className="mt-6">
          <GoldenCircleTab />
        </TabsContent>
        
        <TabsContent value="swot" className="mt-6">
          <SwotAnalysisTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};