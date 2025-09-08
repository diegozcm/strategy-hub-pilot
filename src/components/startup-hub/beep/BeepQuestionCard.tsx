
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";

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
  loadingValue?: number;
}

export const BeepQuestionCard: React.FC<BeepQuestionCardProps> = ({
  question,
  value,
  onChange,
  isLoading = false,
  isSaved = false,
  loadingValue,
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
          hover: 'hover:bg-red-200 hover:text-red-800 hover:border-red-300',
          text: 'text-red-600',
          badge: 'bg-red-100 text-red-700 border-red-200'
        };
      case 2:
        return {
          button: 'bg-orange-500 hover:bg-orange-500 text-white border-orange-500',
          hover: 'hover:bg-orange-200 hover:text-orange-800 hover:border-orange-300',
          text: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      case 3:
        return {
          button: 'bg-yellow-500 hover:bg-yellow-500 text-white border-yellow-500',
          hover: 'hover:bg-yellow-200 hover:text-yellow-800 hover:border-yellow-300',
          text: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-200'
        };
      case 4:
        return {
          button: 'bg-lime-500 hover:bg-lime-500 text-white border-lime-500',
          hover: 'hover:bg-lime-200 hover:text-lime-800 hover:border-lime-300',
          text: 'text-lime-600',
          badge: 'bg-lime-100 text-lime-700 border-lime-200'
        };
      case 5:
        return {
          button: 'bg-green-500 hover:bg-green-500 text-white border-green-500',
          hover: 'hover:bg-green-200 hover:text-green-800 hover:border-green-300',
          text: 'text-green-600',
          badge: 'bg-green-100 text-green-700 border-green-200'
        };
      default:
        return {
          button: '',
          hover: '',
          text: '',
          badge: ''
        };
    }
  };

  return (
    <Card className={`relative transition-all ${(isSaved || value > 0) ? 'border-green-200 bg-green-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>
          </div>
          
          {value > 0 && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${getColorClasses(value).badge}`}
              >
                {scaleLabels[value as keyof typeof scaleLabels]}
              </Badge>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Discordo Totalmente</span>
              <span>Concordo Totalmente</span>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => {
                const colorClasses = getColorClasses(rating);
                const isSelected = value === rating;
                const isLoadingThis = loadingValue === rating;
                
                return (
                  <Button
                    key={rating}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 h-12 flex flex-col gap-1 transition-all ${
                      isLoadingThis ? 'opacity-75 cursor-not-allowed' : ''
                    } ${isSelected ? colorClasses.button : colorClasses.hover}`}
                    onClick={() => onChange(rating)}
                    disabled={isLoadingThis}
                  >
                    {isLoadingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="font-bold">{rating}</span>
                    )}
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
