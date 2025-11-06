import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export const AuthFlowDebugger: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if ?debugAuth=1 is present
    if (searchParams.get('debugAuth') !== '1') {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Poll for updates every 500ms
    const interval = setInterval(() => {
      const buffer = (window as any).__loginTraces || [];
      setAttempts([...buffer].slice(-3)); // Last 3 attempts
    }, 500);

    return () => clearInterval(interval);
  }, [searchParams]);

  if (!isVisible || attempts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] z-50">
      <Card className="bg-background/95 backdrop-blur shadow-2xl border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono">🔐 Auth Flow Debug</CardTitle>
          <CardDescription className="text-xs">
            Last {attempts.length} login attempt(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {attempts.map((attempt, idx) => {
              const duration = attempt.endedAt 
                ? attempt.endedAt - attempt.startedAt 
                : Date.now() - attempt.startedAt;
              const status = attempt.status || 'ongoing';

              return (
                <div key={attempt.id} className="mb-4 pb-4 border-b last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      Attempt #{idx + 1}
                    </span>
                    <Badge 
                      variant={
                        status === 'success' ? 'default' : 
                        status === 'error' ? 'destructive' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {status} ({duration}ms)
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {attempt.steps.map((step, stepIdx) => {
                      const elapsed = step.t - attempt.startedAt;
                      return (
                        <div 
                          key={stepIdx} 
                          className="text-xs font-mono bg-muted/50 p-2 rounded"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-primary font-semibold flex-shrink-0">
                              +{elapsed}ms
                            </span>
                            <span className="flex-1 break-all">
                              {step.label}
                            </span>
                          </div>
                          {step.data && Object.keys(step.data).length > 0 && (
                            <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                              {JSON.stringify(step.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
          
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            💡 Open console and run: <code className="bg-muted px-1 rounded">dumpLoginTraces(3)</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
