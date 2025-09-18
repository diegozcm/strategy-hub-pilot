import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ClientErrorLog {
  message: string;
  source?: string;
  stack?: string;
  time: string; // locale string
}

export interface PerfMetric {
  name: string;
  value: number; // ms
  timestamp: string; // locale string
}

interface StatusChecks {
  react: boolean;
  dom: boolean;
  localStorage: boolean;
  noRecentErrors: boolean;
  memoryUsage: boolean; // true when within reasonable bounds or not available
}

export const useClientDiagnostics = () => {
  const [recentErrors, setRecentErrors] = useState<ClientErrorLog[]>([]);
  const [perfMetrics, setPerfMetrics] = useState<PerfMetric[]>([]);
  const [statusChecks, setStatusChecks] = useState<StatusChecks>({
    react: true,
    dom: true,
    localStorage: true,
    noRecentErrors: true,
    memoryUsage: true,
  });
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  const originalConsoleError = useRef<typeof console.error | null>(null);

  // Attach listeners to collect client-side errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setRecentErrors((prev) => [
        {
          message: event.message || 'Erro desconhecido',
          source: event.filename,
          stack: event.error?.stack,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 50));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = (event as any).reason || {};
      setRecentErrors((prev) => [
        {
          message: typeof reason === 'string' ? reason : (reason?.message || 'Unhandled Rejection'),
          source: 'unhandledrejection',
          stack: reason?.stack,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 50));
    };

    // Patch console.error to capture errors appearing there only
    originalConsoleError.current = console.error;
    console.error = (...args: any[]) => {
      try {
        const msg = args?.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        setRecentErrors((prev) => [
          {
            message: msg || 'Console error',
            source: 'console.error',
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 50));
      } catch {}
      originalConsoleError.current?.(...args as any);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      if (originalConsoleError.current) {
        console.error = originalConsoleError.current;
      }
    };
  }, []);

  const collectPerfMetrics = useCallback(() => {
    const now = new Date();
    const list: PerfMetric[] = [];

    // Navigation timing (legacy but widely available)
    const timing = (performance as any).timing;
    if (timing && timing.navigationStart) {
      const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
      const load = timing.loadEventEnd - timing.navigationStart;
      if (dcl > 0 && Number.isFinite(dcl)) list.push({ name: 'dom_content_loaded', value: dcl, timestamp: now.toLocaleTimeString() });
      if (load > 0 && Number.isFinite(load)) list.push({ name: 'page_load_time', value: load, timestamp: now.toLocaleTimeString() });
    }

    // Paint timings (may be empty depending on browser)
    try {
      const paints = performance.getEntriesByType('paint') as PerformanceEntry[];
      paints.forEach((p) => {
        list.push({ name: p.name, value: Math.round(p.startTime), timestamp: now.toLocaleTimeString() });
      });
    } catch {}

    setPerfMetrics((prev) => {
      const combined = [...list, ...prev];
      return combined.slice(0, 20);
    });
  }, []);

  const runStatusChecks = useCallback(() => {
    let dom = true;
    try {
      const root = document.getElementById('root');
      dom = !!root && root.children.length > 0;
    } catch { dom = false; }

    let localStorageOk = true;
    try {
      const key = '__health_check__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      localStorageOk = true;
    } catch { localStorageOk = false; }

    let memOk = true;
    try {
      const memory: any = (performance as any).memory;
      if (memory && memory.jsHeapSizeLimit && memory.usedJSHeapSize) {
        // Consider above 90% as risky
        memOk = memory.usedJSHeapSize / memory.jsHeapSizeLimit < 0.9;
      }
    } catch { memOk = true; }

    const noRecentErrors = recentErrors.length === 0;

    setStatusChecks({
      react: true, // if this code runs, React mounted
      dom,
      localStorage: localStorageOk,
      noRecentErrors,
      memoryUsage: memOk,
    });
  }, [recentErrors.length]);

  const checkNow = useCallback(() => {
    collectPerfMetrics();
    runStatusChecks();
    setLastChecked(new Date());
  }, [collectPerfMetrics, runStatusChecks]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(checkNow, 15000);
    return () => clearInterval(id);
  }, [autoRefresh, checkNow]);

  const toggleAutoRefresh = useCallback(() => setAutoRefresh((v) => !v), []);

  const exportLogs = useCallback(() => {
    const blob = new Blob([
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        statusChecks,
        recentErrors,
        perfMetrics,
      }, null, 2)
    ], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [statusChecks, recentErrors, perfMetrics]);

  const clearLocalCache = useCallback(() => {
    try {
      localStorage.removeItem('sb-pdpzxjlnaqwlyqoyoyhr-auth-token');
      localStorage.removeItem('selectedCompanyId');
      sessionStorage.clear();
      // Do not force reload here; leave to the UI action
    } catch {}
  }, []);

  // Initial run
  useEffect(() => {
    // small delay to allow initial render
    const t = setTimeout(checkNow, 1000);
    return () => clearTimeout(t);
  }, [checkNow]);

  return {
    recentErrors,
    perfMetrics,
    statusChecks,
    lastChecked,
    autoRefresh,
    toggleAutoRefresh,
    checkNow,
    exportLogs,
    clearLocalCache,
  };
};