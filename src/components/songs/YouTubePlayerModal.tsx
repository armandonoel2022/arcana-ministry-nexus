import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Youtube, ExternalLink } from 'lucide-react';

/**
 * Extracts the YouTube video ID from various URL formats
 */
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

interface YouTubePlayerModalProps {
  url: string;
  songTitle?: string;
  trigger?: React.ReactNode;
}

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({ url, songTitle, trigger }) => {
  const [open, setOpen] = useState(false);
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    // Fallback: open in new tab if we can't extract video ID
    return trigger ? (
      <div onClick={() => window.open(url, '_blank')}>{trigger}</div>
    ) : null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Youtube className="w-4 h-4 text-red-600" />
              {songTitle || 'YouTube'}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="ml-auto h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={songTitle || 'YouTube Video'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YouTubePlayerModal;
