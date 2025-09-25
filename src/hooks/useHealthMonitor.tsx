import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  issues: string[];
  renderingStatus: 'healthy' | 'blank' | 'error';
}

export const useHealthMonitor = () => {
  const { toast } = useToast();
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: true,
    lastCheck: new Date(),
    issues: [],
    renderingStatus: 'healthy'
  });
  
  const blankPageCount = useRef(0);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

  // Monitor for blank page issues
  const checkPageHealth = useCallback(() => {
    // Skip checks if page is hidden (user switched tabs)
    if (document.hidden) {
      return { isHealthy: true, issues: [] };
    }

    const issues: string[] = [];
    
    // More relaxed check for blank page - only flag if both conditions are met
    const mainContent = document.querySelector('main, [role="main"], .container');
    const reactRoot = document.getElementById('root');
    const hasNoMainContent = !mainContent || mainContent.children.length === 0;
    const hasNoRootContent = !reactRoot || reactRoot.children.length === 0;
    
    if (hasNoMainContent && hasNoRootContent) {
      blankPageCount.current += 1;
      // Only consider it a real issue after multiple consecutive checks (20+ seconds)
      if (blankPageCount.current >= 4) {
        issues.push('Página principal sem conteúdo detectada (persistente)');
      }
    } else {
      // Reset counter if content is found
      blankPageCount.current = 0;
    }

    // Check for error boundaries triggered
    const errorBoundaries = document.querySelectorAll('[data-error-boundary="true"]');
    if (errorBoundaries.length > 0) {
      issues.push('Error boundaries ativas detectadas');
    }

    // Check for loading states stuck
    const loadingElements = document.querySelectorAll('[data-loading="true"]');
    if (loadingElements.length > 0) {
      setTimeout(() => {
        const stillLoading = document.querySelectorAll('[data-loading="true"]');
        if (stillLoading.length > 0) {
          issues.push('Estados de loading presos detectados');
        }
      }, 10000); // Check after 10 seconds
    }

    // Check for authentication errors in console
    const authErrors = [];
    try {
      // Check localStorage for auth errors
      const supabaseSession = localStorage.getItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
      if (!supabaseSession || supabaseSession === 'null') {
        authErrors.push('Token de autenticação não encontrado');
      } else {
        try {
          const parsedSession = JSON.parse(supabaseSession);
          if (!parsedSession.access_token) {
            authErrors.push('Access token inválido ou ausente');
          }
          if (parsedSession.expires_at && Date.now() > parsedSession.expires_at * 1000) {
            authErrors.push('Token de autenticação expirado');
          }
        } catch {
          authErrors.push('Token de autenticação corrompido');
        }
      }
    } catch (error) {
      console.warn('Health Monitor: Erro ao verificar auth:', error);
    }

    // React rendering check is now part of the combined blank page check above

    // Check for stuck loading in specific auth states
    const authProviderElements = document.querySelectorAll('[data-testid*="loading"], [data-loading="true"]');
    if (authProviderElements.length > 3) {
      issues.push('Múltiplos elementos de loading detectados - possível loop');
    }

    // Add auth issues to main issues array
    issues.push(...authErrors);

    const isHealthy = issues.length === 0;
    const renderingStatus: 'healthy' | 'blank' | 'error' = 
      issues.some(i => i.includes('sem conteúdo')) ? 'blank' :
      issues.some(i => i.includes('Error')) ? 'error' : 'healthy';

    setHealthStatus({
      isHealthy,
      lastCheck: new Date(),
      issues,
      renderingStatus
    });

    // Alert user if critical issues but NEVER auto-reload
    if (!isHealthy) {
      const hasCriticalIssues = issues.some(i => 
        i.includes('sem conteúdo') || 
        i.includes('Error') ||
        i.includes('Token') ||
        i.includes('loop')
      );
      
      if (hasCriticalIssues) {
        console.error('🚨 Health Monitor: Problemas detectados!', issues);
        
        // Log specific auth errors for debugging
        const authIssues = issues.filter(i => i.includes('Token') || i.includes('autenticação'));
        if (authIssues.length > 0) {
          console.error('🔐 Auth Issues:', authIssues);
        }

        // Only show toast for persistent blank page issues
        if (issues.some(i => i.includes('persistente'))) {
          toast({
            title: "⚠️ Problema Detectado",
            description: "Página sem conteúdo detectada. Verifique a conectividade.",
            variant: "destructive",
          });
        }
        
        // REMOVED: No more automatic reloads - let the user decide
      }
    }

    return { isHealthy, issues };
  }, [toast]);

  // Performance monitoring
  const logPerformance = useCallback((operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Performance: ${operation} took ${duration}ms`);
    
    if (duration > 5000) {
      console.warn(`🐌 Slow operation detected: ${operation} (${duration}ms)`);
      toast({
        title: "Operação Lenta",
        description: `${operation} está demorando mais que o esperado (${duration}ms)`,
        variant: "destructive",
      });
    }
    
    return duration;
  }, [toast]);

  // Monitor render cycles
  const logRenderCycle = useCallback((component: string, phase: 'mount' | 'update' | 'unmount') => {
    console.log(`🔄 Render: ${component} - ${phase} at ${new Date().toISOString()}`);
  }, []);

  // Handle visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      
      if (!document.hidden) {
        // When tab becomes visible, wait a bit before checking (debounce)
        visibilityTimeoutRef.current = setTimeout(() => {
          console.log('🔍 Health Monitor: Verificação após retornar à aba...');
          checkPageHealth();
        }, 1500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [checkPageHealth]);

  // Auto health checks every 30 seconds (less frequent, only when visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkPageHealth();
      }
    }, 30000);
    
    // Initial check after a short delay
    setTimeout(checkPageHealth, 2000);
    
    return () => clearInterval(interval);
  }, [checkPageHealth]);

  return {
    healthStatus,
    checkPageHealth,
    logPerformance,
    logRenderCycle
  };
};