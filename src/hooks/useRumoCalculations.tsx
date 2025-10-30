import { useMemo } from 'react';
import { StrategicPillar, StrategicObjective, KeyResult } from '@/types/strategic-map';
import { useKRCalculations, PeriodType } from './useKRCalculations';

export type { PeriodType };

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
  selectedYear: number = new Date().getFullYear()
): RumoCalculations => {
  return useMemo(() => {
    const krProgress = new Map<string, number>();
    const objectiveProgress = new Map<string, number>();
    const pillarProgress = new Map<string, number>();

    // Calculate KR progress usando o hook compartilhado
    keyResults.forEach(kr => {
      // Criar um objeto KR temporário para usar com useKRCalculations
      // Nota: Não podemos usar o hook dentro do loop, então vamos replicar a lógica
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const lastAvailableMonth = selectedYear < currentYear ? 12 : 
                                 selectedYear === currentYear ? currentMonth : 0;
      
      let target = 0;
      let actual = 0;
      let hasData = false;

      if (periodType === 'monthly' && lastAvailableMonth > 0) {
        // LÓGICA MENSAL: pegar o último mês com dados
        for (let m = lastAvailableMonth; m >= 1; m--) {
          const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
          const monthlyActual = kr.monthly_actual?.[key];
          const monthlyTarget = kr.monthly_targets?.[key];
          
          const hasTarget = typeof monthlyTarget === 'number' && Number.isFinite(monthlyTarget) && monthlyTarget !== 0;
          const hasActual = typeof monthlyActual === 'number' && Number.isFinite(monthlyActual);
          
          if (hasTarget && hasActual) {
            target = monthlyTarget;
            actual = monthlyActual;
            hasData = true;
            break;
          }
        }
      } else if (periodType === 'ytd' && lastAvailableMonth > 0) {
        // LÓGICA YTD: acumular jan até mês atual
        for (let m = 1; m <= lastAvailableMonth; m++) {
          const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
          const monthlyActual = kr.monthly_actual?.[key];
          const monthlyTarget = kr.monthly_targets?.[key];
          
          const hasTarget = typeof monthlyTarget === 'number' && Number.isFinite(monthlyTarget);
          const hasActual = typeof monthlyActual === 'number' && Number.isFinite(monthlyActual);
          
          if (hasTarget && hasActual) {
            target += monthlyTarget;
            actual += monthlyActual;
            hasData = true;
          }
        }
      }

      // Calcular percentual usando a mesma lógica do useKRCalculations
      let progress = 0;
      if (hasData && target !== 0) {
        const status = {
          percentage: 0,
          isGood: false,
          isExcellent: false,
          color: 'text-red-600'
        };
        
        const direction = kr.target_direction || 'maximize';
        if (direction === 'minimize') {
          status.percentage = target > 0 ? ((target - actual) / target) * 100 + 100 : 0;
        } else {
          status.percentage = target > 0 ? (actual / target) * 100 : 0;
        }
        
        progress = status.percentage;
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
  }, [pillars, objectives, keyResults, periodType, selectedYear]);
};

export const getPerformanceColor = (progress: number): string => {
  if (progress > 105) return 'excellent';  // Blue - Superado
  if (progress >= 91) return 'success';    // Green - No Alvo
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
