import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useMultiTenant';
import { useNavigate } from 'react-router-dom';

export const CompanyInactivePage: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleBackToLogin = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-red-800">
            Empresa Inativa
          </CardTitle>
          <CardDescription className="text-gray-600">
            A empresa associada ao seu usuário está temporariamente inativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">O que isso significa?</h3>
            <p className="text-sm text-red-700">
              Sua empresa foi temporariamente desativada pelo administrador do sistema. 
              Durante este período, não é possível acessar a plataforma.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Entre em contato
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Para reativar sua empresa ou obter mais informações, entre em contato com o administrador do sistema:
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-blue-700"><strong>Email:</strong> admin@sistema.com</p>
              <p className="text-blue-700"><strong>Telefone:</strong> (11) 9999-9999</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleBackToLogin}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};