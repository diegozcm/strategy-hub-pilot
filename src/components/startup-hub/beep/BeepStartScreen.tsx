
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BeepAssessmentHistory } from './BeepAssessmentHistory';

interface BeepAssessment {
  id: string;
  user_id: string;
  startup_name: string | null;
  status: 'draft' | 'completed';
  final_score: number | null;
  maturity_level: string | null;
  completed_at: string | null;
  created_at: string;
}

interface BeepStartScreenProps {
  onStartAssessment: (startupName: string) => void;
  isCreating: boolean;
  assessments: BeepAssessment[];
}

export const BeepStartScreen: React.FC<BeepStartScreenProps> = ({
  onStartAssessment,
  isCreating,
  assessments
}) => {
  const [startupName, setStartupName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startupName.trim()) {
      onStartAssessment(startupName.trim());
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Avaliação BEEP</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          O BEEP (Business Entrepreneur and Evolution Phases) é uma ferramenta de avaliação 
          que ajuda a identificar o nível de maturidade da sua startup através de questões 
          organizadas em categorias estratégicas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">100+</div>
              <p className="text-sm text-muted-foreground">Perguntas estratégicas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">5</div>
              <p className="text-sm text-muted-foreground">Níveis de maturidade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <p className="text-sm text-muted-foreground">Categorias principais</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Assessment Form */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Iniciar Nova Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="startup-name">Nome da Startup</Label>
              <Input
                id="startup-name"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Digite o nome da sua startup"
                required
              />
            </div>
            <Button 
              type="submit"
              disabled={!startupName.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? 'Iniciando...' : 'Iniciar Avaliação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Assessment History */}
      {assessments.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <BeepAssessmentHistory assessments={assessments} />
        </div>
      )}
    </div>
  );
};
