"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  link: string | null;
  changeRequestId: string | null;
  createdAt: string;
  changeRequest?: {
    id: string;
    status: string;
    requesterId: string;
    requester: {
      name: string;
      username: string;
    };
    newDueDate?: string;
    reason?: string;
    newStatus?: string;
    originalStatus?: string;
    task: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
        workspace: {
          id: string;
          name: string;
        };
      };
    };
  } | null;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      toast.error("Failed to fetch notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (notificationId: string, changeRequestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeRequestStatus: status, isRead: true }),
      });
      toast.success(`Request has been ${status.toLowerCase()}.`);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to process request.");
    }
  };

  const markAllAsRead = async () => {
    const originalNotifications = [...notifications];
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

    if (unreadIds.length === 0) return;

    // Optimistically update the UI
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    try {
      await Promise.all(
        unreadIds.map(id => fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        }))
      );
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error("Failed to mark all as read. Reverting changes.");
      setNotifications(originalNotifications);
    }
  };

  const handleSelectNotification = async (notification: Notification) => {
    setSelectedNotification(notification);

    if (!notification.isRead) {
      // Optimistic UI update
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
      } catch (error) {
        toast.error("Failed to mark notification as read.");
        // Revert on failure
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, isRead: false } : n
          )
        );
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(null);
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      toast.success("Notification deleted.");
    } catch (error) {
      toast.error("Failed to delete notification.");
      setNotifications(originalNotifications);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Inbox</h2>
          <Button onClick={markAllAsRead} size="sm" variant="outline" disabled={!notifications.some(n => !n.isRead)}>
            Mark all as read
          </Button>
        </div>
        <div className="divide-y">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedNotification?.id === n.id ? 'bg-gray-100' : ''}`} onClick={() => handleSelectNotification(n)}>
              <div className="flex items-start">
                {!n.isRead && <div className="h-2.5 w-2.5 bg-blue-500 rounded-full mr-3 mt-1.5"></div>}
                <div className={n.isRead ? 'pl-[22px]' : ''}>
                  <div className="flex justify-between">
                    <p className={`font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-500'}`}>{n.changeRequest?.requester.name || n.changeRequest?.requester.username}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                  <p className={`text-sm truncate ${!n.isRead ? 'text-gray-800' : 'text-gray-500'}`}>{n.message}</p>
                  {n.changeRequest && (
                    <div className="mt-2">
                      {n.changeRequest.status === 'PENDING' && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">未处理</Badge>
                      )}
                      {n.changeRequest.status === 'APPROVED' && (
                        <Badge>已批准</Badge>
                      )}
                      {n.changeRequest.status === 'REJECTED' && (
                        <Badge variant="destructive">已拒绝</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-center py-8">No notifications yet.</p>
          )}
        </div>
      </div>

      <div className="w-2/3 p-6">
        {selectedNotification ? (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>
                  {selectedNotification.changeRequest ? "Request Details" : "Notification"}
                </CardTitle>
                {selectedNotification.changeRequest && (
                  <CardDescription>
                    <span className="font-semibold">{selectedNotification.changeRequest.requester.name || selectedNotification.changeRequest.requester.username}</span> from workspace <span className="font-semibold">{selectedNotification.changeRequest.task.project.workspace.name}</span> requested changes for task <span className="font-semibold">{selectedNotification.changeRequest.task.name}</span>.
                  </CardDescription>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(selectedNotification.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {selectedNotification.changeRequest ? (
                <>
                  <div className="grid gap-y-6">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Task</h4>
                      <p className="text-base">{selectedNotification.changeRequest.task.name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Project</h4>
                      <p className="text-base">{selectedNotification.changeRequest.task.project.name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Requested Change</h4>
                      <div className="mt-2 space-y-4 rounded-lg border bg-slate-50 p-4">
                        {selectedNotification.changeRequest.newStatus ? (
                          <div>
                            <p className="font-medium">Status Change</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{selectedNotification.changeRequest.originalStatus}</Badge>
                              <span>→</span>
                              <Badge>{selectedNotification.changeRequest.newStatus}</Badge>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">Status Change</p>
                            <p className="text-sm text-gray-500">No status change requested.</p>
                          </div>
                        )}
                        <hr />
                        {selectedNotification.changeRequest.newDueDate ? (
                          <div>
                            <p className="font-medium">New Due Date</p>
                            <p>{new Date(selectedNotification.changeRequest.newDueDate).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">New Due Date</p>
                            <p className="text-sm text-gray-500">No due date change requested.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedNotification.changeRequest.reason && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">Reason for Request</h4>
                        <p className="mt-2 rounded-lg border bg-slate-50 p-4 text-sm">{selectedNotification.changeRequest.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t">
                    {selectedNotification.changeRequest.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button onClick={() => handleAction(selectedNotification.id, selectedNotification.changeRequest!.id, 'APPROVED')}><Check className="h-4 w-4 mr-1" />Approve</Button>
                        <Button variant="outline" onClick={() => handleAction(selectedNotification.id, selectedNotification.changeRequest!.id, 'REJECTED')}><X className="h-4 w-4 mr-1" />Reject</Button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold">Status:</h4>
                        <Badge variant={selectedNotification.changeRequest.status === 'APPROVED' ? 'default' : 'destructive'}>
                          {selectedNotification.changeRequest.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p>{selectedNotification.message}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a notification to view details.
          </div>
        )}
      </div>
    </div>
  );
}

const NotificationItem = ({ notification, onAction, session, userRole }: { notification: Notification, onAction: Function, session: any, userRole: string | null }) => {
  const canApprove = userRole === 'admin' || userRole === 'owner';
  return (
    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
      <div>
        <p>{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
      </div>
      {notification.changeRequestId && notification.changeRequest && canApprove && notification.changeRequest.requesterId !== session?.user?.id && notification.changeRequest.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAction(notification.id, notification.changeRequest!.id, 'APPROVED')}><Check className="h-4 w-4 mr-1" />Approve</Button>
          <Button size="sm" variant="outline" onClick={() => onAction(notification.id, notification.changeRequest!.id, 'REJECTED')}><X className="h-4 w-4 mr-1" />Reject</Button>
        </div>
      )}
    </div>
  )
}

