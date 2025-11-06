// Login Trace System - Ring buffer logger for diagnosing auth flow issues

interface LoginStep {
  t: number;
  label: string;
  data?: Record<string, any>;
}

interface LoginAttempt {
  id: string;
  startedAt: number;
  endedAt?: number;
  status?: 'success' | 'error' | 'aborted';
  steps: LoginStep[];
}

const MAX_ATTEMPTS = 10;
const STORAGE_KEY = '__login_traces__';

// Get or initialize the ring buffer
function getBuffer(): LoginAttempt[] {
  try {
    if (typeof window === 'undefined') return [];
    
    // Try memory first
    if ((window as any).__loginTraces) {
      return (window as any).__loginTraces;
    }
    
    // Try localStorage fallback
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      (window as any).__loginTraces = parsed;
      return parsed;
    }
    
    // Initialize empty
    (window as any).__loginTraces = [];
    return [];
  } catch (err) {
    console.warn('[LoginTrace] Failed to get buffer:', err);
    return [];
  }
}

function saveBuffer(buffer: LoginAttempt[]) {
  try {
    if (typeof window === 'undefined') return;
    
    (window as any).__loginTraces = buffer;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch (err) {
    console.warn('[LoginTrace] Failed to save buffer:', err);
  }
}

function sanitizeData(data: any): Record<string, any> {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Never log passwords or tokens
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

let currentAttemptId: string | null = null;

export function startAttempt(context?: Record<string, any>): string {
  try {
    const attemptId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentAttemptId = attemptId;
    
    const buffer = getBuffer();
    
    const attempt: LoginAttempt = {
      id: attemptId,
      startedAt: Date.now(),
      steps: []
    };
    
    if (context) {
      attempt.steps.push({
        t: Date.now(),
        label: 'START',
        data: sanitizeData(context)
      });
    }
    
    // Add to buffer (ring buffer behavior)
    buffer.push(attempt);
    if (buffer.length > MAX_ATTEMPTS) {
      buffer.shift();
    }
    
    saveBuffer(buffer);
    
    console.log(`🔐 [LoginTrace] Started attempt: ${attemptId}`, context);
    
    return attemptId;
  } catch (err) {
    console.warn('[LoginTrace] Failed to start attempt:', err);
    return 'error_' + Date.now();
  }
}

export function logStep(step: string, data?: any, attemptId?: string) {
  try {
    let targetId = attemptId || currentAttemptId;
    
    // If no active attempt, create a global "session" attempt
    if (!targetId) {
      const buffer = getBuffer();
      let sessionAttempt = buffer.find(a => a.id.startsWith('session_') && !a.endedAt);
      
      if (!sessionAttempt) {
        targetId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionAttempt = {
          id: targetId,
          startedAt: Date.now(),
          steps: []
        };
        buffer.push(sessionAttempt);
        if (buffer.length > MAX_ATTEMPTS) {
          buffer.shift();
        }
        saveBuffer(buffer);
      } else {
        targetId = sessionAttempt.id;
      }
    }
    
    const buffer = getBuffer();
    const attempt = buffer.find(a => a.id === targetId);
    
    if (!attempt) {
      console.warn('[LoginTrace] Attempt not found:', targetId);
      return;
    }
    
    const logEntry: LoginStep = {
      t: Date.now(),
      label: step,
      data: data ? sanitizeData(data) : undefined
    };
    
    attempt.steps.push(logEntry);
    saveBuffer(buffer);
    
    const elapsed = Date.now() - attempt.startedAt;
    console.log(`🔐 [LoginTrace +${elapsed}ms] ${step}`, data);
  } catch (err) {
    console.warn('[LoginTrace] Failed to log step:', err);
  }
}

export function endAttempt(status: 'success' | 'error' | 'aborted', data?: any, attemptId?: string) {
  try {
    const targetId = attemptId || currentAttemptId;
    if (!targetId) {
      console.warn('[LoginTrace] No active attempt to end');
      return;
    }
    
    const buffer = getBuffer();
    const attempt = buffer.find(a => a.id === targetId);
    
    if (!attempt) {
      console.warn('[LoginTrace] Attempt not found:', targetId);
      return;
    }
    
    attempt.endedAt = Date.now();
    attempt.status = status;
    
    if (data) {
      attempt.steps.push({
        t: Date.now(),
        label: 'END',
        data: sanitizeData(data)
      });
    }
    
    saveBuffer(buffer);
    
    const duration = attempt.endedAt - attempt.startedAt;
    console.log(`🔐 [LoginTrace] Ended attempt ${targetId}: ${status} (${duration}ms)`, data);
    
    if (currentAttemptId === targetId) {
      currentAttemptId = null;
    }
  } catch (err) {
    console.warn('[LoginTrace] Failed to end attempt:', err);
  }
}

export function dump(n: number = 3): LoginAttempt[] {
  try {
    const buffer = getBuffer();
    const recent = buffer.slice(-n);
    
    console.group(`🔐 [LoginTrace] Last ${n} attempts`);
    
    recent.forEach((attempt, idx) => {
      const duration = attempt.endedAt ? attempt.endedAt - attempt.startedAt : Date.now() - attempt.startedAt;
      const status = attempt.status || 'ongoing';
      
      console.group(`#${idx + 1} ${attempt.id} - ${status} (${duration}ms)`);
      console.log('Started:', new Date(attempt.startedAt).toISOString());
      if (attempt.endedAt) {
        console.log('Ended:', new Date(attempt.endedAt).toISOString());
      }
      
      console.table(attempt.steps.map(step => ({
        'Time': new Date(step.t).toISOString(),
        'Elapsed (ms)': step.t - attempt.startedAt,
        'Step': step.label,
        'Data': JSON.stringify(step.data || {})
      })));
      
      console.groupEnd();
    });
    
    console.groupEnd();
    
    return recent;
  } catch (err) {
    console.warn('[LoginTrace] Failed to dump:', err);
    return [];
  }
}

// Expose to window for easy access
if (typeof window !== 'undefined') {
  (window as any).dumpLoginTraces = dump;
  (window as any).clearLoginTraces = () => {
    (window as any).__loginTraces = [];
    localStorage.removeItem(STORAGE_KEY);
    console.log('🔐 [LoginTrace] Cleared all traces');
  };
}
