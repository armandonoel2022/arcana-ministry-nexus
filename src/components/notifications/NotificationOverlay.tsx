import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: number;
  notification_category: string;
  metadata: any;
  created_at: string;
}

// Types that should be handled by OverlayManager as full-screen overlays, NOT as toast banners
const OVERLAY_TYPES = [
  'birthday_daily',
  'birthday_monthly',
  'service_program',
  'service_overlay',
  'daily_verse',
  'daily_advice',
  'death_announcement',
  'meeting_announcement',
  'special_service',
  'prayer_request',
  'blood_donation',
  'extraordinary_rehearsal',
  'ministry_instructions'
];

const NotificationOverlay = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('is_read', false)
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) {
        // Filter out overlay types - those are handled by OverlayManager
        const toastNotifications = data.filter(n => 
          !OVERLAY_TYPES.includes(n.type) && !dismissedIds.has(n.id)
        );
        setNotifications(toastNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [dismissedIds]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('toast-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Only add to toast if it's NOT an overlay type
          if (!newNotification.is_read && !OVERLAY_TYPES.includes(newNotification.type)) {
            setNotifications(prev => {
              // Prevent duplicates
              if (prev.some(n => n.id === newNotification.id)) return prev;
              // Keep only 3 max
              const updated = [newNotification, ...prev];
              return updated.slice(0, 3);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const dismissNotification = async (notificationId: string) => {
    // Mark as read in database
    await supabase
      .from('system_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    // Track dismissed locally
    setDismissedIds(prev => new Set([...prev, notificationId]));
    // Remove from view
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      const oldestNotification = notifications[notifications.length - 1];
      if (oldestNotification) {
        dismissNotification(oldestNotification.id);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className="animate-slide-in-right pointer-events-auto"
        >
          <Card className="border-l-4 border-l-blue-500 shadow-lg bg-white">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {notification.title}
                  </h3>
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default NotificationOverlay;
