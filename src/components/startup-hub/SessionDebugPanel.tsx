import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bug, User, Building2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useMultiTenant';

interface SessionDebugPanelProps {
  debugInfo: any;
  sessions: any[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const SessionDebugPanel: React.FC<SessionDebugPanelProps> = ({
  debugInfo,
  sessions,
  loading,
  error,
  onRefresh
}) => {
  const { user } = useAuth();

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-orange-600" />
            <CardTitle className="text-sm text-orange-800">Debug de Sessões</CardTitle>
          </div>
          <Button 
            onClick={onRefresh} 
            disabled={loading}
            variant="outline" 
            size="sm"
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription className="text-xs text-orange-700">
          Informações de debug para resolver problemas de carregamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* User Info */}
        <div className="flex items-center gap-2 p-2 bg-white rounded border">
          <User className="h-3 w-3 text-blue-600" />
          <div className="flex-1">
            <div className="font-medium text-blue-800">Usuário</div>
            <div className="text-blue-600">
              ID: {user?.id || 'N/A'} | Email: {user?.email || 'N/A'}
            </div>
          </div>
          <Badge variant={user ? 'default' : 'destructive'} className="text-xs">
            {user ? 'OK' : 'NO USER'}
          </Badge>
        </div>

        {/* Company Info */}
        <div className="flex items-center gap-2 p-2 bg-white rounded border">
          <Building2 className="h-3 w-3 text-green-600" />
          <div className="flex-1">
            <div className="font-medium text-green-800">Empresa</div>
            <div className="text-green-600">
              {debugInfo.companyName || 'N/A'} ({debugInfo.companyId || 'N/A'})
            </div>
          </div>
          <Badge variant={debugInfo.companyId ? 'default' : 'secondary'} className="text-xs">
            {debugInfo.companyId ? 'FOUND' : 'NOT FOUND'}
          </Badge>
        </div>

        {/* Sessions Info */}
        <div className="flex items-center gap-2 p-2 bg-white rounded border">
          <Calendar className="h-3 w-3 text-purple-600" />
          <div className="flex-1">
            <div className="font-medium text-purple-800">Sessões</div>
            <div className="text-purple-600">
              {sessions.length} sessão(s) carregada(s) | Método: {debugInfo.method || 'N/A'}
            </div>
          </div>
          <Badge variant={sessions.length > 0 ? 'default' : 'secondary'} className="text-xs">
            {sessions.length > 0 ? `${sessions.length} FOUND` : 'NONE'}
          </Badge>
        </div>

        {/* Current Step */}
        <div className="p-2 bg-white rounded border">
          <div className="font-medium text-gray-800 mb-1">Status Atual</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Step: {debugInfo.step || 'unknown'}
            </Badge>
            <Badge variant={loading ? 'default' : error ? 'destructive' : 'secondary'} className="text-xs">
              {loading ? 'LOADING' : error ? 'ERROR' : 'IDLE'}
            </Badge>
          </div>
          {debugInfo.timestamp && (
            <div className="text-gray-500 text-xs mt-1">
              Última atualização: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Error Details */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <div className="font-medium text-red-800 mb-1">Erro</div>
            <div className="text-red-600 text-xs">{error}</div>
          </div>
        )}

        {/* Raw Debug Data */}
        <details className="p-2 bg-gray-50 rounded border text-xs">
          <summary className="cursor-pointer font-medium text-gray-700">
            Dados Raw de Debug
          </summary>
          <pre className="mt-2 text-xs overflow-auto max-h-32 text-gray-600">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};