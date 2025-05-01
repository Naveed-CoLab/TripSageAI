import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { NOTIFICATION_SOUND } from "@/assets/notification-sound";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read_at: string | null;
  is_read: boolean;
  user_id: number;
  admin_id: number;
  admin_username: string;
  link?: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationSound] = useState(() => {
    if (typeof window !== 'undefined') {
      return new Audio(NOTIFICATION_SOUND);
    }
    return null;
  });
  
  // Keep track of previous unread count to detect new notifications
  const prevUnreadCountRef = useRef(0);
  
  // Fetch all notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      return await apiRequest('/api/notifications', 'GET');
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest(`/api/notifications/${notificationId}/read`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/notifications/mark-all-read', 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setUnreadCount(0);
    },
  });
  
  // Initialize prevUnreadCountRef once on initial load
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const unread = notifications.filter((n: Notification) => !n.read_at && !n.is_read).length;
      prevUnreadCountRef.current = unread;
    }
  }, [notifications]);

  useEffect(() => {
    // Calculate unread count
    if (notifications && notifications.length > 0) {
      const unread = notifications.filter((n: Notification) => !n.read_at && !n.is_read).length;
      
      // If unread count has increased since last check, there's a new notification
      if (unread > prevUnreadCountRef.current) {
        setHasNewNotification(true);
        
        // Play sound for new notifications
        if (notificationSound) {
          // Try to play the sound - mobile browsers may restrict this without user interaction
          notificationSound.play().catch(e => console.log('Error playing sound:', e));
          
          // Show toast for the newest notification
          const newestNotification = notifications
            .filter((n: Notification) => !n.read_at && !n.is_read)
            .sort((a: Notification, b: Notification) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            
          if (newestNotification) {
            // Map notification types to toast variants
            let variant: 'default' | 'destructive' | undefined = 'default';
            if (newestNotification.type === 'error') {
              variant = 'destructive';
            }
            
            toast({
              title: newestNotification.title,
              description: newestNotification.message,
              variant: variant,
            });
          }
        }
      }
      
      // Update state and refs
      setUnreadCount(unread);
      prevUnreadCountRef.current = unread;
    }
  }, [notifications, notificationSound, toast]);

  return {
    notifications,
    unreadCount,
    hasNewNotification,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    refetchNotifications: refetch,
    setHasNewNotification,
  };
}