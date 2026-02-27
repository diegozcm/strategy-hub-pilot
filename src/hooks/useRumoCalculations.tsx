import { useMemo } from 'react';
import { StrategicPillar, StrategicObjective, KeyResult } from '@/types/strategic-map';
import { isKRNullForPeriod, getKRPercentageForPeriod } from '@/lib/krHelpers';

export type PeriodType = 'monthly' | 'ytd' | 'yearly' | 'quarterly' | 'semesterly' | 'bimonthly';

interface RumoCalculations {
  pillarProgress: Map<string, number | null>;
  objectiveProgress: Map<string, number | null>;
  krProgress: Map<string, number | null>;
  finalScore: number | null;
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
    selectedSemester?: 1 | 2;
    selectedSemesterYear?: number;
    selectedBimonth?: 1 | 2 | 3 | 4 | 5 | 6;
    selectedBimonthYear?: number;
  }
): RumoCalculations => {
  return useMemo(() => {
    const krProgress = new Map<string, number | null>();
    const objectiveProgress = new Map<string, number | null>();
    const pillarProgress = new Map<string, number | null>();

    // Build period options for krHelpers functions
    const periodOptions = {
      selectedMonth: options?.selectedMonth,
      selectedYear: options?.selectedYear,
      selectedQuarter: options?.selectedQuarter as 1 | 2 | 3 | 4 | undefined,
      selectedQuarterYear: options?.selectedQuarterYear,
      selectedSemester: options?.selectedSemester as 1 | 2 | undefined,
      selectedSemesterYear: options?.selectedSemesterYear,
      selectedBimonth: options?.selectedBimonth as 1 | 2 | 3 | 4 | 5 | 6 | undefined,
      selectedBimonthYear: options?.selectedBimonthYear,
    };

    // Calculate KR progress - use centralized function that handles null vs zero
    keyResults.forEach(kr => {
      const percentage = getKRPercentageForPeriod(kr, periodType, periodOptions);
      krProgress.set(kr.id, percentage);
    });

    // Calculate Objective progress (weighted average of its KRs, excluding nulls)
    objectives.forEach(obj => {
      const objKRs = keyResults.filter(kr => kr.objective_id === obj.id);
      
      if (objKRs.length === 0) {
        objectiveProgress.set(obj.id, null);
        return;
      }

      // Filter to KRs with non-null progress
      const validKRs = objKRs.filter(kr => krProgress.get(kr.id) !== null);
      
      if (validKRs.length === 0) {
        objectiveProgress.set(obj.id, null);
        return;
      }

      const totalWeight = validKRs.reduce((sum, kr) => sum + (kr.weight || 1), 0);
      const weightedProgress = validKRs.reduce((sum, kr) => {
        const progress = krProgress.get(kr.id) as number;
        const weight = kr.weight || 1;
        return sum + (progress * weight);
      }, 0);
      
      objectiveProgress.set(obj.id, totalWeight > 0 ? weightedProgress / totalWeight : 0);
    });

    // Calculate Pillar progress (average of its objectives, excluding nulls)
    pillars.forEach(pillar => {
      const pillarObjectives = pillar.objectives || [];
      
      if (pillarObjectives.length === 0) {
        pillarProgress.set(pillar.id, null);
        return;
      }

      const validObjectives = pillarObjectives.filter(obj => objectiveProgress.get(obj.id) !== null);
      
      if (validObjectives.length === 0) {
        pillarProgress.set(pillar.id, null);
        return;
      }

      const avgProgress = validObjectives.reduce((sum, obj) => {
        return sum + (objectiveProgress.get(obj.id) as number);
      }, 0) / validObjectives.length;
      
      pillarProgress.set(pillar.id, avgProgress);
    });

    // Calculate final score (average of all pillars, excluding nulls)
    let finalScore: number | null = null;
    if (pillars.length > 0) {
      const validPillars = Array.from(pillarProgress.values()).filter((v): v is number => v !== null);
      if (validPillars.length > 0) {
        finalScore = validPillars.reduce((sum, p) => sum + p, 0) / validPillars.length;
      }
    }

    const hasData = pillars.length > 0;

    return {
      pillarProgress,
      objectiveProgress,
      krProgress,
      finalScore,
      hasData,
    };
  }, [pillars, objectives, keyResults, periodType, options?.selectedMonth, options?.selectedYear, options?.selectedQuarter, options?.selectedQuarterYear, options?.selectedSemester, options?.selectedSemesterYear, options?.selectedBimonth, options?.selectedBimonthYear]);
};

export const getPerformanceColor = (progress: number | null): string => {
  if (progress === null) return 'empty';
  if (progress > 105) return 'excellent';
  if (progress >= 100) return 'success';
  if (progress >= 71) return 'warning';
  return 'critical';
};

export const getPerformanceStyles = (performance: string): string => {
  const styles: Record<string, string> = {
    excellent: 'bg-blue-500 text-white border-blue-600',
    success: 'bg-green-500 text-white border-green-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    critical: 'bg-red-500 text-white border-red-600',
    empty: 'bg-gray-400 text-white border-gray-500',
  };
  return styles[performance] || styles.critical;
};
