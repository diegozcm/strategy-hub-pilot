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

    // Calculate KR progress dynamically based on period selection
    keyResults.forEach(kr => {
      let progress = 0;
      
      if (periodType === 'ytd') {
        // YTD sempre usa valor pré-calculado do banco
        progress = kr.ytd_percentage || 0;
      } else if (periodType === 'monthly' && options?.selectedMonth && options?.selectedYear) {
        // Calcular dinamicamente o mês específico selecionado
        const monthKey = `${options.selectedYear}-${String(options.selectedMonth).padStart(2, '0')}`;
        const target = kr.monthly_targets?.[monthKey];
        const actual = kr.monthly_actual?.[monthKey];
        
        if (typeof target === 'number' && target > 0 && typeof actual === 'number') {
          const direction = kr.target_direction || 'maximize';
          if (direction === 'minimize') {
            progress = (target / actual) * 100;
          } else {
            progress = (actual / target) * 100;
          }
        }
      } else if (periodType === 'yearly' && options?.selectedYear) {
        // Calcular dinamicamente o ano específico selecionado
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Se é o ano atual, usar valor pré-calculado
        if (options.selectedYear === currentYear) {
          progress = kr.yearly_percentage || 0;
        } else {
          // Para anos anteriores, agregar os 12 meses do ano selecionado
          const aggregationType = kr.aggregation_type || 'sum';
          let totalTarget = 0;
          let totalActual = 0;
          let hasData = false;
          
          for (let month = 1; month <= 12; month++) {
            const monthKey = `${options.selectedYear}-${String(month).padStart(2, '0')}`;
            const target = kr.monthly_targets?.[monthKey];
            const actual = kr.monthly_actual?.[monthKey];
            
            if (typeof target === 'number' && typeof actual === 'number') {
              hasData = true;
              if (aggregationType === 'sum') {
                totalTarget += target;
                totalActual += actual;
              } else if (aggregationType === 'average') {
                totalTarget += target;
                totalActual += actual;
              }
            }
          }
          
          if (hasData && totalTarget > 0) {
            if (aggregationType === 'average') {
              totalTarget = totalTarget / 12;
              totalActual = totalActual / 12;
            }
            
            const direction = kr.target_direction || 'maximize';
            if (direction === 'minimize') {
              progress = (totalTarget / totalActual) * 100;
            } else {
              progress = (totalActual / totalTarget) * 100;
            }
          }
        }
      } else if (periodType === 'quarterly' && options?.selectedQuarter && options?.selectedQuarterYear) {
        // Calcular dinamicamente o trimestre específico selecionado
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
        
        // Se é o trimestre atual do ano atual, usar valor pré-calculado
        if (options.selectedQuarterYear === currentYear && options.selectedQuarter === currentQuarter) {
          switch (options.selectedQuarter) {
            case 1: progress = kr.q1_percentage || 0; break;
            case 2: progress = kr.q2_percentage || 0; break;
            case 3: progress = kr.q3_percentage || 0; break;
            case 4: progress = kr.q4_percentage || 0; break;
          }
        } else {
          // Para outros trimestres, agregar os 3 meses do trimestre
          const aggregationType = kr.aggregation_type || 'sum';
          const quarterStartMonth = (options.selectedQuarter - 1) * 3 + 1;
          let totalTarget = 0;
          let totalActual = 0;
          let hasData = false;
          
          for (let i = 0; i < 3; i++) {
            const month = quarterStartMonth + i;
            const monthKey = `${options.selectedQuarterYear}-${String(month).padStart(2, '0')}`;
            const target = kr.monthly_targets?.[monthKey];
            const actual = kr.monthly_actual?.[monthKey];
            
            if (typeof target === 'number' && typeof actual === 'number') {
              hasData = true;
              if (aggregationType === 'sum') {
                totalTarget += target;
                totalActual += actual;
              } else if (aggregationType === 'average') {
                totalTarget += target;
                totalActual += actual;
              }
            }
          }
          
          if (hasData && totalTarget > 0) {
            if (aggregationType === 'average') {
              totalTarget = totalTarget / 3;
              totalActual = totalActual / 3;
            }
            
            const direction = kr.target_direction || 'maximize';
            if (direction === 'minimize') {
              progress = (totalTarget / totalActual) * 100;
            } else {
              progress = (totalActual / totalTarget) * 100;
            }
          }
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

    const hasData = keyResults.length > 0 && objectives.length > 0 && pillars.length > 0;

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
