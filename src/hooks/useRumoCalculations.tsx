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
  periodType: PeriodType = 'monthly'
): RumoCalculations => {
  return useMemo(() => {
    const krProgress = new Map<string, number>();
    const objectiveProgress = new Map<string, number>();
    const pillarProgress = new Map<string, number>();

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Calculate KR progress
    keyResults.forEach(kr => {
      // Use yearly values as base (same logic as ResultadoChaveMiniCard)
      const currentValue = kr.yearly_actual || kr.current_value || 0;
      const targetValue = kr.yearly_target || kr.target_value || 0;
      
      // Calculate using helper function that considers target_direction
      const status = calculateKRStatus(
        currentValue,
        targetValue,
        kr.target_direction || 'maximize'
      );
      
      let progress = status.percentage;
      const annualProgress = progress; // Store annual progress as fallback
      
      // If there's monthly data, adjust to show only the selected period
      if (periodType === 'monthly') {
        const monthlyActual = kr.monthly_actual?.[monthKey];
        const monthlyTarget = kr.monthly_targets?.[monthKey];
        
        if (monthlyActual !== undefined && monthlyActual !== null && 
            monthlyTarget !== undefined && monthlyTarget !== null && monthlyTarget > 0) {
          // If has monthly data, use it for the monthly period
          const monthlyStatus = calculateKRStatus(
            monthlyActual,
            monthlyTarget,
            kr.target_direction || 'maximize'
          );
          // Only use monthly progress if it's positive, otherwise keep annual
          if (monthlyStatus.percentage > 0) {
            progress = monthlyStatus.percentage;
          }
        }
        // Otherwise, keep the progress calculated with yearly values
      } else if (periodType === 'ytd') {
        // For YTD, try to calculate based on accumulated months
        let ytdActual = 0;
        let ytdTarget = 0;
        let hasMonthlyData = false;

        for (let m = 1; m <= currentMonth; m++) {
          const key = `${currentYear}-${String(m).padStart(2, '0')}`;
          const actual = kr.monthly_actual?.[key];
          const target = kr.monthly_targets?.[key];
          
          if (actual !== undefined && target !== undefined) {
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
          // Only use YTD progress if it's positive, otherwise keep annual
          if (ytdStatus.percentage > 0) {
            progress = ytdStatus.percentage;
          }
        }
        // Otherwise, keep the progress calculated with yearly values
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
  }, [pillars, objectives, keyResults, periodType]);
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
