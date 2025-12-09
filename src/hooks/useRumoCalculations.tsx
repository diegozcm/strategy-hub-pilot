import { useMemo } from 'react';
import { StrategicPillar, StrategicObjective, KeyResult } from '@/types/strategic-map';
import { calculateKRStatus } from '@/lib/krHelpers';

export type PeriodType = 'monthly' | 'ytd' | 'yearly' | 'quarterly';

interface RumoCalculations {
  pillarProgress: Map<string, number>;
  objectiveProgress: Map<string, number>;
  krProgress: Map<string, number>;
  finalScore: number;
  hasData: boolean;
}

export const useRumoCalculations = (
  pillars: StrategicPillar[],
  objectives: StrategicObjective[],
  keyResults: KeyResult[],
  periodType: PeriodType = 'monthly',
  options?: {
    selectedMonth?: number;
    selectedYear?: number;
    selectedQuarter?: 1 | 2 | 3 | 4;
    selectedQuarterYear?: number;
  }
): RumoCalculations => {
  return useMemo(() => {
    const krProgress = new Map<string, number>();
    const objectiveProgress = new Map<string, number>();
    const pillarProgress = new Map<string, number>();

    // Get current month/year OR use selected month/year
    const now = new Date();
    const currentMonth = options?.selectedMonth ?? (now.getMonth() + 1);
    const currentYear = options?.selectedYear ?? now.getFullYear();
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Calculate KR progress using pre-calculated database fields
    keyResults.forEach(kr => {
      let progress = 0;
      
      // Use pre-calculated percentages from database based on period type
      if (periodType === 'monthly') {
        // Se mês customizado foi fornecido, recalcular
        if (options?.selectedMonth && options?.selectedYear) {
          const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
          const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
          
          const monthTarget = monthlyTargets[monthKey] || 0;
          const monthActual = monthlyActual[monthKey] || 0;
          
          // Usar mesma lógica do banco para calcular percentage
          // Para minimize: sem dados (actual=0) = 0%, não 100%
          if (kr.target_direction === 'minimize') {
            progress = (monthActual > 0 && monthTarget > 0) ? (monthTarget / monthActual) * 100 : 0;
          } else if (monthTarget > 0) {
            progress = (monthActual / monthTarget) * 100;
          }
        } else {
          // Usar valor pré-calculado do mês atual
          progress = kr.monthly_percentage || 0;
        }
      } else if (periodType === 'ytd') {
        progress = kr.ytd_percentage || 0;
      } else if (periodType === 'yearly') {
        const year = options?.selectedYear ?? now.getFullYear();
        const monthKeys = [];
        for (let m = 1; m <= 12; m++) {
          monthKeys.push(`${year}-${m.toString().padStart(2, '0')}`);
        }
        
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        
        let totalTarget = 0;
        let totalActual = 0;
        
        // Aplicar agregação baseada no tipo
        if (kr.aggregation_type === 'average') {
          // Pegar apenas os meses que têm dados de actual
          const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
          
          const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
          const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
          
          totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
          totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
        } else if (kr.aggregation_type === 'max') {
          totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
          totalActual = Math.max(...monthKeys.map(key => monthlyActual[key] || 0), 0);
        } else if (kr.aggregation_type === 'min') {
          const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
          const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
          totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
          totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
        } else {
          // sum (default)
          totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
          totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        }
        
        // Para minimize: sem dados (actual=0) = 0%, não 100%
        if (kr.target_direction === 'minimize') {
          progress = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
        } else if (totalTarget > 0) {
          progress = (totalActual / totalTarget) * 100;
        }
      } else if (periodType === 'quarterly') {
        const quarter = options?.selectedQuarter || 1;
        const year = options?.selectedQuarterYear ?? now.getFullYear();
        
        // Calcular dinamicamente usando dados mensais
        const monthlyTargets = (kr.monthly_targets as Record<string, number>) || {};
        const monthlyActual = (kr.monthly_actual as Record<string, number>) || {};
        
        const quarterMonths = {
          1: [1, 2, 3],
          2: [4, 5, 6],
          3: [7, 8, 9],
          4: [10, 11, 12]
        }[quarter];
        
        const monthKeys = quarterMonths.map(m => `${year}-${m.toString().padStart(2, '0')}`);
        
        let totalTarget = 0;
        let totalActual = 0;
        
        // Aplicar agregação baseada no tipo
        if (kr.aggregation_type === 'average') {
          // Pegar apenas os meses que têm dados de actual
          const monthsWithActual = monthKeys.filter(key => (monthlyActual[key] || 0) !== 0);
          
          const targets = monthsWithActual.map(key => monthlyTargets[key] || 0);
          const actuals = monthsWithActual.map(key => monthlyActual[key] || 0);
          
          totalTarget = targets.length > 0 ? targets.reduce((sum, v) => sum + v, 0) / targets.length : 0;
          totalActual = actuals.length > 0 ? actuals.reduce((sum, v) => sum + v, 0) / actuals.length : 0;
        } else if (kr.aggregation_type === 'max') {
          totalTarget = Math.max(...monthKeys.map(key => monthlyTargets[key] || 0), 0);
          totalActual = Math.max(...monthKeys.map(key => monthlyActual[key] || 0), 0);
        } else if (kr.aggregation_type === 'min') {
          const targets = monthKeys.map(key => monthlyTargets[key] || 0).filter(v => v > 0);
          const actuals = monthKeys.map(key => monthlyActual[key] || 0).filter(v => v > 0);
          totalTarget = targets.length > 0 ? Math.min(...targets) : 0;
          totalActual = actuals.length > 0 ? Math.min(...actuals) : 0;
        } else {
          // sum (default)
          totalTarget = monthKeys.reduce((sum, key) => sum + (monthlyTargets[key] || 0), 0);
          totalActual = monthKeys.reduce((sum, key) => sum + (monthlyActual[key] || 0), 0);
        }
        
        // Para minimize: sem dados (actual=0) = 0%, não 100%
        if (kr.target_direction === 'minimize') {
          progress = (totalActual > 0 && totalTarget > 0) ? (totalTarget / totalActual) * 100 : 0;
        } else if (totalTarget > 0) {
          progress = (totalActual / totalTarget) * 100;
        }
      }

      krProgress.set(kr.id, Math.max(0, progress));
    });

    // Calculate Objective progress (average of its KRs)
    objectives.forEach(obj => {
      const objKRs = keyResults.filter(kr => kr.objective_id === obj.id);
      
      if (objKRs.length > 0) {
        const avgProgress = objKRs.reduce((sum, kr) => {
          return sum + (krProgress.get(kr.id) || 0);
        }, 0) / objKRs.length;
        
        objectiveProgress.set(obj.id, avgProgress);
      } else {
        objectiveProgress.set(obj.id, 0);
      }
    });

    // Calculate Pillar progress (average of its objectives)
    pillars.forEach(pillar => {
      const pillarObjectives = pillar.objectives || [];
      
      if (pillarObjectives.length > 0) {
        const avgProgress = pillarObjectives.reduce((sum, obj) => {
          return sum + (objectiveProgress.get(obj.id) || 0);
        }, 0) / pillarObjectives.length;
        
        pillarProgress.set(pillar.id, avgProgress);
      } else {
        pillarProgress.set(pillar.id, 0);
      }
    });

    // Calculate final score (average of all pillars)
    let finalScore = 0;
    if (pillars.length > 0) {
      const totalProgress = Array.from(pillarProgress.values()).reduce((sum, p) => sum + p, 0);
      finalScore = totalProgress / pillars.length;
    }

    // Mostrar estrutura mesmo sem KRs filtrados (pilares e objetivos com 0%)
    const hasData = pillars.length > 0;

    return {
      pillarProgress,
      objectiveProgress,
      krProgress,
      finalScore,
      hasData,
    };
  }, [pillars, objectives, keyResults, periodType, options?.selectedMonth, options?.selectedYear, options?.selectedQuarter, options?.selectedQuarterYear]);
};

export const getPerformanceColor = (progress: number): string => {
  if (progress > 105) return 'excellent';  // Blue - Excelente (superou a meta)
  if (progress >= 100) return 'success';   // Green - No Alvo
  if (progress >= 71) return 'warning';    // Yellow - Atenção
  return 'critical';                       // Red - Crítico
};

export const getPerformanceStyles = (performance: string): string => {
  const styles = {
    excellent: 'bg-blue-500 text-white border-blue-600',
    success: 'bg-green-500 text-white border-green-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    critical: 'bg-red-500 text-white border-red-600',
  };
  return styles[performance as keyof typeof styles] || styles.critical;
};
