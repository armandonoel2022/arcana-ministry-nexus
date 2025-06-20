
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Target } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  description: string;
  why: string;
  instrument?: string;
  style?: string;
  onFeedback: (type: 'up' | 'down') => void;
  currentFeedback?: 'up' | 'down' | null;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  description,
  why,
  instrument,
  style,
  onFeedback,
  currentFeedback
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          {(instrument || style) && (
            <Badge variant="secondary" className="bg-arcana-blue-50 text-arcana-blue-700 border-arcana-blue-200">
              {instrument ||Style}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            {description}
          </p>
          
          <div className="bg-arcana-gold-50 p-3 rounded-lg border-l-4 border-arcana-gold-400">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-arcana-gold-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-arcana-gold-800 text-sm mb-1">
                  Objetivo:
                </h4>
                <p className="text-sm text-arcana-gold-700">
                  {why}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
          <Button
            variant={currentFeedback === 'up' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFeedback('up')}
            className={`flex items-center gap-1 ${
              currentFeedback === 'up' 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Útil
          </Button>
          <Button
            variant={currentFeedback === 'down' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFeedback('down')}
            className={`flex items-center gap-1 ${
              currentFeedback === 'down' 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            No útil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
