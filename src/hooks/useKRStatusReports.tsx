import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KRStatusReport {
  id: string;
  key_result_id: string;
  report_date: string;
  status_summary: string;
  challenges?: string;
  achievements?: string;
  next_steps?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useKRStatusReports = (keyResultId?: string) => {
  const [reports, setReports] = useState<KRStatusReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar relatórios de status
  const loadReports = async () => {
    if (!keyResultId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kr_status_reports')
        .select('*')
        .eq('key_result_id', keyResultId)
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading status reports:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios de status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo relatório
  const createReport = async (reportData: Omit<KRStatusReport, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('kr_status_reports')
        .insert([{
          ...reportData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [data as KRStatusReport, ...prev]);
      toast({
        title: "Sucesso",
        description: "Relatório de status criado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Error creating status report:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar relatório de status",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Atualizar relatório
  const updateReport = async (reportId: string, updates: Partial<KRStatusReport>) => {
    try {
      const { data, error } = await supabase
        .from('kr_status_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, ...data } as KRStatusReport : report
      ));

      toast({
        title: "Sucesso",
        description: "Relatório de status atualizado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Error updating status report:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar relatório de status",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deletar relatório
  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('kr_status_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(report => report.id !== reportId));
      toast({
        title: "Sucesso",
        description: "Relatório de status deletado com sucesso",
      });
    } catch (error) {
      console.error('Error deleting status report:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar relatório de status",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Obter relatórios por período
  const getReportsByPeriod = (startDate: string, endDate: string) => {
    return reports.filter(report => 
      report.report_date >= startDate && report.report_date <= endDate
    );
  };

  // Obter último relatório
  const getLatestReport = () => {
    return reports.length > 0 ? reports[0] : null;
  };

  // Carregar relatórios quando keyResultId mudar
  useEffect(() => {
    if (keyResultId) {
      loadReports();
    }
  }, [keyResultId]);

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    loadReports,
    getReportsByPeriod,
    getLatestReport,
  };
};