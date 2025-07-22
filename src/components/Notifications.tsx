"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  link: string | null;
  changeRequestId: string | null;
  createdAt: string;
  changeRequest?: {
    status: string;
    requesterId: string;
  }
}

export const Notifications = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const workspaceId = pathname.split("/")[3];

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!workspaceId) return;
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/user-role`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    };
    fetchUserRole();
  }, [workspaceId]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleAction = async (notificationId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeRequestStatus: status, isRead: true }),
      });
      toast.success(`Request has been ${status.toLowerCase()}.`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      toast.error("Failed to process request.");
    }
  };

  const canApprove = userRole === 'admin' || userRole === 'owner';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="p-4">
          <h4 className="font-medium text-sm mb-4">Notifications</h4>
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-lg ${!n.isRead ? 'bg-blue-50' : ''}`}>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
                {n.changeRequestId && n.changeRequest && (
                  <>
                    {canApprove && n.changeRequest.requesterId !== session?.user?.id ? (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleAction(n.id, 'APPROVED')}><Check className="h-4 w-4 mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(n.id, 'REJECTED')}><X className="h-4 w-4 mr-1" />Reject</Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">Status: {n.changeRequest.status}</p>
                    )}
                  </>
                )}
                {!n.isRead && !n.changeRequestId && (
                  <Button size="sm" variant="link" onClick={() => handleMarkAsRead(n.id)}>Mark as read</Button>
                )}
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">No new notifications.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 