import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read_at: string | null;
  user_id: number;
  admin_id: number;
  admin_username: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationSound] = useState(() => {
    if (typeof window !== 'undefined') {
      return new Audio('/notification-sound.mp3');
    }
    return null;
  });

  // Fetch all notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications');
      const data = await res.json();
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', '/api/notifications/mark-all-read');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setUnreadCount(0);
    },
  });

  useEffect(() => {
    // Calculate unread count
    if (notifications && notifications.length > 0) {
      const unread = notifications.filter((n: Notification) => !n.read_at).length;
      
      // If unread count has increased, there's a new notification
      if (unread > unreadCount) {
        setHasNewNotification(true);
        // Play sound if a notification arrives
        if (notificationSound && unreadCount > 0) {
          notificationSound.play().catch(e => console.log('Error playing sound:', e));
          
          // Show toast for the newest notification
          const newestNotification = notifications.filter((n: Notification) => !n.read_at)
            .sort((a: Notification, b: Notification) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            
          if (newestNotification) {
            toast({
              title: newestNotification.title,
              description: newestNotification.message,
              variant: newestNotification.type === 'success' ? 'default' : 
                      newestNotification.type === 'error' ? 'destructive' : 'default',
            });
          }
        }
      }
      
      setUnreadCount(unread);
    }
  }, [notifications, notificationSound, toast, unreadCount]);

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