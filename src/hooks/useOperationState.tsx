import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OperationState {
  [operationId: string]: {
    loading: boolean;
    error: string | null;
    startTime: number;
    retryCount: number;
  };
}

export const useOperationState = () => {
  const { toast } = useToast();
  const [operations, setOperations] = useState<OperationState>({});

  // Start an operation
  const startOperation = useCallback((operationId: string, description?: string) => {
    console.log(`🚀 Starting operation: ${operationId}${description ? ` (${description})` : ''}`);
    
    setOperations(prev => ({
      ...prev,
      [operationId]: {
        loading: true,
        error: null,
        startTime: Date.now(),
        retryCount: 0
      }
    }));
  }, []);

  // Complete an operation successfully
  const completeOperation = useCallback((operationId: string, description?: string) => {
    setOperations(prev => {
      const operation = prev[operationId];
      if (operation) {
        const duration = Date.now() - operation.startTime;
        console.log(`✅ Operation completed: ${operationId} (${duration}ms)${description ? ` - ${description}` : ''}`);
      }
      
      const { [operationId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Fail an operation
  const failOperation = useCallback((operationId: string, error: any, context?: string) => {
    setOperations(prev => {
      const operation = prev[operationId];
      const retryCount = operation?.retryCount || 0;
      
      console.error(`❌ Operation failed: ${operationId}${context ? ` (${context})` : ''}`, error);
      
      return {
        ...prev,
        [operationId]: {
          loading: false,
          error: error instanceof Error ? error.message : String(error),
          startTime: operation?.startTime || Date.now(),
          retryCount: retryCount + 1
        }
      };
    });

    // Show user-friendly error
    toast({
      title: "Operação Falhou",
      description: context || `Erro na operação ${operationId}`,
      variant: "destructive",
    });
  }, [toast]);

  // Retry an operation
  const retryOperation = useCallback((operationId: string) => {
    const operation = operations[operationId];
    if (!operation) return false;

    if (operation.retryCount >= 3) {
      console.error(`🚫 Max retries exceeded for operation: ${operationId}`);
      toast({
        title: "Falha Persistente",
        description: "Operação falhou múltiplas vezes. Tente recarregar a página.",
        variant: "destructive",
      });
      return false;
    }

    console.log(`🔄 Retrying operation: ${operationId} (attempt ${operation.retryCount + 1})`);
    
    setOperations(prev => ({
      ...prev,
      [operationId]: {
        ...operation,
        loading: true,
        error: null,
        startTime: Date.now()
      }
    }));

    return true;
  }, [operations, toast]);

  // Get operation status
  const getOperationStatus = useCallback((operationId: string) => {
    return operations[operationId] || {
      loading: false,
      error: null,
      startTime: 0,
      retryCount: 0
    };
  }, [operations]);

  // Check if any operations are loading
  const isAnyLoading = useCallback(() => {
    return Object.values(operations).some(op => op.loading);
  }, [operations]);

  // Get all failed operations
  const getFailedOperations = useCallback(() => {
    return Object.entries(operations)
      .filter(([_, op]) => op.error !== null)
      .map(([id, op]) => ({ id, ...op }));
  }, [operations]);

  return {
    startOperation,
    completeOperation,
    failOperation,
    retryOperation,
    getOperationStatus,
    isAnyLoading,
    getFailedOperations,
    operations
  };
};