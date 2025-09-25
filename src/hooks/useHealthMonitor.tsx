import { useState, useEffect, useCallback } from 'react';
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

  // Monitor for blank page issues
  const checkPageHealth = useCallback(() => {
    const issues: string[] = [];
    
    // Check if main content exists
    const mainContent = document.querySelector('main, [role="main"], .container');
    if (!mainContent || mainContent.children.length === 0) {
      issues.push('Página principal sem conteúdo detectada');
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

    // Check for React rendering issues
    const reactRoot = document.getElementById('root');
    if (reactRoot && reactRoot.children.length === 0) {
      issues.push('Aplicação React não renderizou');
    }

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

    // Alert user if critical issues
    if (!isHealthy) {
      const hasCriticalIssues = issues.some(i => 
        i.includes('sem conteúdo') || 
        i.includes('não renderizou') ||
        i.includes('Token') ||
        i.includes('loop')
      );
      
      if (hasCriticalIssues) {
        console.error('🚨 Health Monitor: Problemas críticos detectados!', issues);
        
        // Log specific auth errors for debugging
        const authIssues = issues.filter(i => i.includes('Token') || i.includes('autenticação'));
        if (authIssues.length > 0) {
          console.error('🔐 Auth Issues:', authIssues);
        }

        toast({
          title: "⚠️ Problema Detectado",
          description: `Sistema detectou: ${issues[0]}. ${authIssues.length > 0 ? 'Problemas de autenticação detectados.' : ''}`,
          variant: "destructive",
        });
        
        // Only auto-reload for very specific critical cases, not for general auth issues
        const shouldAutoReload = issues.some(i => 
          i.includes('sem conteúdo') || 
          i.includes('não renderizou') ||
          i.includes('loop')
        ) && !authIssues.length; // Don't auto-reload for auth issues as they often resolve on their own
        
        if (shouldAutoReload) {
          const reloadDelay = 5000; // Increased delay to give time for self-recovery
          setTimeout(() => {
            window.location.reload();
          }, reloadDelay);
        }
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

  // Auto health checks every 15 seconds (more frequent for better detection)
  useEffect(() => {
    const interval = setInterval(checkPageHealth, 15000);
    
    // Initial check after a short delay
    setTimeout(checkPageHealth, 2000);
    
    // Additional check for auth issues after page load
    setTimeout(() => {
      console.log('🔍 Health Monitor: Verificação específica de autenticação...');
      checkPageHealth();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [checkPageHealth]);

  return {
    healthStatus,
    checkPageHealth,
    logPerformance,
    logRenderCycle
  };
};