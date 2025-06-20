
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Target, Music, Mic, Heart, X } from "lucide-react";

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: {
    id: string;
    title: string;
    description: string;
    why: string;
    type: 'voice' | 'music' | 'dance';
    instrument?: string;
    style?: string;
  };
  onFeedback: (type: 'up' | 'down') => void;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  recommendation,
  onFeedback
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'voice':
        return 'Voces';
      case 'music':
        return 'Músicos';
      case 'dance':
        return 'Danzarinas';
      default:
        return 'Ministerio';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'dance':
        return <Heart className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'voice':
        return 'bg-blue-500 text-white';
      case 'music':
        return 'bg-purple-500 text-white';
      case 'dance':
        return 'bg-pink-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-arcana-gradient p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTypeColors(recommendation.type)}`}>
              {getTypeIcon(recommendation.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold">Recomendación del Día</h2>
              <Badge variant="secondary" className="bg-white/20 text-white border-0 mt-1">
                Para {getTypeLabel(recommendation.type)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              {recommendation.title}
              {(recommendation.instrument || recommendation.style) && (
                <Badge variant="outline" className="text-xs">
                  {recommendation.instrument || recommendation.style}
                </Badge>
              )}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {recommendation.description}
            </p>
          </div>

          {/* Objetivo */}
          <div className="bg-arcana-gold-50 p-4 rounded-xl border-l-4 border-arcana-gold-400">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-arcana-gold-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-arcana-gold-800 mb-1">
                  Objetivo:
                </h4>
                <p className="text-sm text-arcana-gold-700">
                  {recommendation.why}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={() => onFeedback('up')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Me resultó útil
            </Button>
            <Button
              onClick={() => onFeedback('down')}
              variant="outline"
              className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No me ayudó
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
