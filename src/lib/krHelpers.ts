/**
 * Helper functions for Key Result calculations and status determination
 */

export type TargetDirection = 'maximize' | 'minimize';

interface KRStatusResult {
  percentage: number;
  isGood: boolean;
  isExcellent: boolean;
  color: string;
}

/**
 * Calculates the status of a Key Result based on actual vs target values
 * and the target direction (maximize or minimize)
 */
export const calculateKRStatus = (
  actual: number,
  target: number,
  direction: TargetDirection = 'maximize'
): KRStatusResult => {
  let percentage: number;
  
  if (direction === 'minimize') {
    // Fórmula do banco: (target / actual) * 100
    // Se actual < target = bom (>100%), se actual > target = ruim (<100%)
    if (actual > 0) {
      percentage = (target / actual) * 100;
    } else if (target === 0) {
      percentage = 100; // Meta 0, realizado 0 = 100%
    } else {
      percentage = 0;
    }
  } else {
    // Para maximize: actual / target * 100
    percentage = target > 0 ? (actual / target) * 100 : 0;
  }
  
  const isExcellent = percentage > 105;
  const isSuccess = percentage >= 100;
  const isGood = percentage >= 71;
  
  const color = isExcellent ? 'text-blue-600' : 
                isSuccess ? 'text-green-600' :
                isGood ? 'text-yellow-600' : 
                'text-red-600';
  
  return { percentage, isGood, isExcellent, color };
};

/**
 * Determines if the trend icon should point up or down based on performance
 */
export const getKRTrendIcon = (
  actual: number,
  target: number,
  direction: TargetDirection = 'maximize'
): 'up' | 'down' => {
  const status = calculateKRStatus(actual, target, direction);
  return status.isExcellent ? 'up' : 'down';
};

/**
 * Gets a human-readable label for the target direction
 */
export const getDirectionLabel = (direction: TargetDirection): string => {
  return direction === 'maximize' 
    ? '📈 Maior é melhor' 
    : '📉 Menor é melhor';
};

/**
 * Gets a description for the target direction
 */
export const getDirectionDescription = (direction: TargetDirection): string => {
  return direction === 'maximize'
    ? 'ex: vendas, satisfação, lucro'
    : 'ex: custos, reclamações, tempo de espera';
};

/**
 * Sorts Key Results by weight (highest weight first - priority 10 at top)
 * KRs without weight default to 1
 */
export const sortKRsByWeight = <T extends { weight?: number | null }>(krs: T[]): T[] => {
  return [...krs].sort((a, b) => {
    const weightA = a.weight || 1;
    const weightB = b.weight || 1;
    // Maior peso primeiro (decrescente)
    return weightB - weightA;
  });
};
