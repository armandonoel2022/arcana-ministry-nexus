
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SongSelectionIndicatorProps {
  songId: string;
  compact?: boolean;
}

const SongSelectionIndicator: React.FC<SongSelectionIndicatorProps> = ({ songId, compact = false }) => {
  const [selectionCount, setSelectionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSelectionCount();
  }, [songId]);

  const fetchSelectionCount = async () => {
    try {
      const { data, error } = await supabase
        .from('song_selections')
        .select('id')
        .eq('song_id', songId);

      if (error) throw error;
      setSelectionCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching selection count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return compact ? null : <div className="text-xs text-gray-500">...</div>;
  }

  if (selectionCount === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3 text-green-600" />
        <span className="text-xs text-green-600 font-medium">{selectionCount}</span>
      </div>
    );
  }

  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      <CheckCircle className="w-3 h-3 mr-1" />
      Seleccionada {selectionCount} {selectionCount === 1 ? 'vez' : 'veces'}
    </Badge>
  );
};

export default SongSelectionIndicator;
