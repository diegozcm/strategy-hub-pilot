
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const getColorClasses = (rating: number) => {
    switch (rating) {
      case 1:
        return {
          button: 'bg-red-500 hover:bg-red-500 text-white border-red-500',
          text: 'text-red-600',
          badge: 'bg-red-100 text-red-700 border-red-200'
        };
      case 2:
        return {
          button: 'bg-orange-500 hover:bg-orange-500 text-white border-orange-500',
          text: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      case 3:
        return {
          button: 'bg-yellow-500 hover:bg-yellow-500 text-white border-yellow-500',
          text: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-200'
        };
      case 4:
        return {
          button: 'bg-lime-500 hover:bg-lime-500 text-white border-lime-500',
          text: 'text-lime-600',
          badge: 'bg-lime-100 text-lime-700 border-lime-200'
        };
      case 5:
        return {
          button: 'bg-green-500 hover:bg-green-500 text-white border-green-500',
          text: 'text-green-600',
          badge: 'bg-green-100 text-green-700 border-green-200'
        };
      default:
        return {
          button: '',
          text: '',
          badge: ''
        };
    }
  };

  return (
    <Card className={`relative transition-all ${value > 0 ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      {isSaved && (
        <div className="absolute top-2 right-2 z-10 animate-fade-in flex items-center gap-2">
          <div className="bg-green-100 rounded-full p-1 shadow-sm">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          {value > 0 && (
            <Badge 
              variant="outline" 
              className={`text-xs font-medium ${getColorClasses(value).badge}`}
            >
              {scaleLabels[value as keyof typeof scaleLabels]}
            </Badge>
          )}
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
              {[1, 2, 3, 4, 5].map(rating => {
                const colorClasses = getColorClasses(rating);
                const isSelected = value === rating;
                
                return (
                  <Button
                    key={rating}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 h-12 flex flex-col gap-1 transition-all ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isSelected ? colorClasses.button : `hover:${colorClasses.button.split(' ')[0]} hover:${colorClasses.button.split(' ')[1]} hover:text-white hover:border-${colorClasses.button.split(' ')[0].replace('bg-', '')}`}`}
                    onClick={() => onChange(rating)}
                    disabled={isLoading}
                  >
                    <span className="font-bold">{rating}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
