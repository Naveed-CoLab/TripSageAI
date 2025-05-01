import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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

export default function NotificationPopover() {
  const { notifications, unreadCount, hasNewNotification, setHasNewNotification, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  // Reset the notification indicator when opening the popover
  useEffect(() => {
    if (open && hasNewNotification) {
      setHasNewNotification(false);
    }
  }, [open, hasNewNotification, setHasNewNotification]);

  function handleNotificationClick(notification: Notification) {
    // Check if notification is unread (using either field for compatibility)
    if (!notification.read_at && !notification.is_read) {
      markAsRead(notification.id);
    }
    
    // If notification has a link, navigate to it
    if (notification.link) {
      window.location.href = notification.link;
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full h-9 w-9 hover:bg-gray-100 relative"
        >
          <Bell className="h-5 w-5 text-gray-500" />
          {unreadCount > 0 && (
            <span 
              className={cn(
                "absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full text-[11px] font-bold text-white bg-red-500 shadow-sm",
                hasNewNotification && "animate-pulse"
              )}
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 hover:bg-gray-100"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px] overflow-y-auto p-2">
          {notifications?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {notifications.map((notification: Notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors",
                    (!notification.read_at && !notification.is_read) && "bg-primary-50",
                    notification.type === 'success' && "border-l-2 border-green-500",
                    notification.type === 'error' && "border-l-2 border-red-500",
                    notification.type === 'info' && "border-l-2 border-blue-500",
                    notification.type === 'warning' && "border-l-2 border-yellow-500"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-500">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700">{notification.message}</p>
                  <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                    <span>From: {notification.admin_username || 'System'}</span>
                    {(!notification.read_at && !notification.is_read) && <span className="text-primary-600 font-medium">New</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No notifications
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}