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
    if (!isHealthy && issues.some(i => i.includes('sem conteúdo'))) {
      console.error('🚨 Health Monitor: Página em branco detectada!', issues);
      toast({
        title: "⚠️ Problema Detectado",
        description: "Sistema detectou possível página em branco. Recarregando...",
        variant: "destructive",
      });
      
      // Auto-reload on blank page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

  // Auto health checks every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkPageHealth, 30000);
    
    // Initial check
    setTimeout(checkPageHealth, 1000);
    
    return () => clearInterval(interval);
  }, [checkPageHealth]);

  return {
    healthStatus,
    checkPageHealth,
    logPerformance,
    logRenderCycle
  };
};