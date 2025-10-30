import { useMemo } from 'react';
import { StrategicPillar, StrategicObjective, KeyResult } from '@/types/strategic-map';
import { calculateKRStatus } from '@/lib/krHelpers';

export type PeriodType = 'monthly' | 'ytd';

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

    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Determinar o último mês disponível baseado no ano selecionado
    const lastAvailableMonth = selectedYear < currentYear ? 12 : 
                               selectedYear === currentYear ? currentMonth : 
                               0; // Ano futuro, sem dados
    
    const monthKey = `${selectedYear}-${String(lastAvailableMonth).padStart(2, '0')}`;

    // Calculate KR progress
    keyResults.forEach(kr => {
      let progress = 0;
      
      // Only use monthly data from the selected year (no fallback to yearly fields)
      if (periodType === 'monthly' && lastAvailableMonth > 0) {
        // Use the most recent month in selectedYear that has valid data
        for (let m = lastAvailableMonth; m >= 1; m--) {
          const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
          const monthlyActual = kr.monthly_actual?.[key];
          const monthlyTarget = kr.monthly_targets?.[key];
          const hasTarget = typeof monthlyTarget === 'number' && Number.isFinite(monthlyTarget) && monthlyTarget > 0;
          const hasActual = typeof monthlyActual === 'number' && Number.isFinite(monthlyActual);
          if (hasTarget && hasActual) {
            const monthlyStatus = calculateKRStatus(
              monthlyActual,
              monthlyTarget,
              kr.target_direction || 'maximize'
            );
            progress = monthlyStatus.percentage;
            break;
          }
        }
      } else if (periodType === 'ytd' && lastAvailableMonth > 0) {
        // For YTD, calculate based on accumulated months
        let ytdActual = 0;
        let ytdTarget = 0;
        let hasMonthlyData = false;

        // Acumular de janeiro até o último mês disponível do ano selecionado
        for (let m = 1; m <= lastAvailableMonth; m++) {
          const key = `${selectedYear}-${String(m).padStart(2, '0')}`;
          const actual = kr.monthly_actual?.[key];
          const target = kr.monthly_targets?.[key];
          const hasTarget = typeof target === 'number' && Number.isFinite(target) && target > 0;
          const hasActual = typeof actual === 'number' && Number.isFinite(actual);
          
          if (hasTarget && hasActual) {
            ytdActual += actual;
            ytdTarget += target;
            hasMonthlyData = true;
          }
        }

        if (hasMonthlyData && ytdTarget > 0) {
          const ytdStatus = calculateKRStatus(
            ytdActual,
            ytdTarget,
            kr.target_direction || 'maximize'
          );
          progress = ytdStatus.percentage;
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
