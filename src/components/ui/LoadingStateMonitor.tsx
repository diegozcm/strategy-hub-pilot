import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useMultiTenant';
import { useToast } from '@/hooks/use-toast';

export const LoadingStateMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();
  const { toast } = useToast();
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const loadingStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (loading) {
      console.log('⏳ Loading state started');
      loadingStartTime.current = Date.now();
      
      // Set a timeout to detect stuck loading states
      loadingTimeoutRef.current = setTimeout(() => {
        const duration = Date.now() - loadingStartTime.current;
        console.error('🚨 Loading state stuck for:', duration, 'ms');
        
        toast({
          title: "⚠️ Carregamento Lento",
          description: "O sistema está demorando para carregar. Isso pode indicar um problema de conectividade.",
          variant: "destructive",
        });

        // If loading is stuck for more than 15 seconds, force reload
        if (duration > 15000) {
          console.error('🚨 Forcing reload due to stuck loading state');
          window.location.reload();
        }
      }, 10000); // 10 seconds timeout
    } else {
      const duration = Date.now() - loadingStartTime.current;
      if (duration > 1000) {
        console.log('✅ Loading completed in:', duration, 'ms');
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, toast]);

  return <>{children}</>;
};