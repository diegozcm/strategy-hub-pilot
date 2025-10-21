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
    // For minimization KRs, invert the logic
    // If target is 100 and actual is 50, it's 100% better (50% less)
    // If target is 100 and actual is 150, it's -50% (50% worse)
    if (target > 0) {
      // Calculate how much better/worse compared to target
      // actual < target = good (saved/reduced)
      // actual > target = bad (exceeded/increased)
      percentage = ((target - actual) / target) * 100 + 100;
    } else {
      percentage = 0;
    }
  } else {
    // Current logic for maximization
    percentage = target > 0 ? (actual / target) * 100 : 0;
  }
  
  const isExcellent = percentage >= 100;
  const isGood = percentage >= 80;
  
  const color = isExcellent ? 'text-green-600' : 
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
