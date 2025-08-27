
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

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
  isLoading?: boolean;
  isSaved?: boolean;
}

export const BeepQuestionCard: React.FC<BeepQuestionCardProps> = ({
  question,
  value,
  onChange,
  isLoading = false,
  isSaved = false,
}) => {
  const scaleLabels = {
    1: 'Discordo Totalmente',
    2: 'Discordo Parcialmente', 
    3: 'Neutro',
    4: 'Concordo Parcialmente',
    5: 'Concordo Totalmente'
  };

  return (
    <Card className={`relative transition-all ${value > 0 ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      {isSaved && (
        <div className="absolute top-2 right-2 z-10 animate-fade-in">
          <div className="bg-green-100 rounded-full p-1 shadow-sm">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        </div>
      )}
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>
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
                  className={`flex-1 h-12 flex flex-col gap-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => onChange(rating)}
                  disabled={isLoading}
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
