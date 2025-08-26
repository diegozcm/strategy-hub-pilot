
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BeepQuestion {
  id: string;
  question_text: string;
  weight: number;
  order_index: number;
}

interface BeepQuestionCardProps {
  question: BeepQuestion;
  value: number;
  onChange: (value: number) => void;
}

export const BeepQuestionCard: React.FC<BeepQuestionCardProps> = ({
  question,
  value,
  onChange
}) => {
  const scaleLabels = {
    1: 'Discordo Totalmente',
    2: 'Discordo Parcialmente', 
    3: 'Neutro',
    4: 'Concordo Parcialmente',
    5: 'Concordo Totalmente'
  };

  return (
    <Card className={`transition-all ${value > 0 ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>
            <Badge variant="outline" className="shrink-0">
              Peso {question.weight}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Discordo Totalmente</span>
              <span>Concordo Totalmente</span>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <Button
                  key={rating}
                  variant={value === rating ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-12 flex flex-col gap-1"
                  onClick={() => onChange(rating)}
                >
                  <span className="font-bold">{rating}</span>
                </Button>
              ))}
            </div>
            
            {value > 0 && (
              <p className="text-xs text-center text-muted-foreground bg-white p-2 rounded border">
                {scaleLabels[value as keyof typeof scaleLabels]}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
