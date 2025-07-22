"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bell, Check, X, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  link: string | null;
  changeRequestId: string | null;
  createdAt: string;
  workspace: {
    id: string;
    name: string;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
  task: {
    id: string;
    name: string;
  } | null;
  actor: {
    id: string;
    name: string | null;
    username: string;
  } | null;
  changeRequest: {
    id: string;
    status: string;
    requesterId: string;
    requester: {
      id: string;
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
    processor: {
      name: string;
      username: string;
    } | null;
  } | null;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

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

  const handleAction = async (
    notificationId: string,
    changeRequestId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const originalNotifications = [...notifications];

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId) {
          return {
            ...n,
            isRead: true,
            changeRequest: n.changeRequest
              ? { ...n.changeRequest, status }
              : null,
          };
        }
        return n;
      })
    );

    if (selectedNotification?.id === notificationId) {
      setSelectedNotification((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isRead: true,
          changeRequest: prev.changeRequest
            ? { ...prev.changeRequest, status }
            : null,
        };
      });
    }

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeRequestStatus: status, isRead: true }),
      });
      toast.success(`Request has been ${status.toLowerCase()}.`);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to process request. Reverting changes.");
      setNotifications(originalNotifications);
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(
          originalNotifications.find((n) => n.id === notificationId) || null
        );
      }
    }
  };

  const markAllAsRead = async () => {
    const originalNotifications = [...notifications];
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

    if (unreadIds.length === 0) return;

    // Optimistically update the UI
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setSelectedIds(new Set());

    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
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
      setNotifications((prev) =>
        prev.map((n) =>
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
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: false } : n
          )
        );
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const originalNotifications = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
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

  const handleBatchDelete = async () => {
    const notificationsToDelete = notifications.filter((n) =>
      selectedIds.has(n.id)
    );
    const hasUnprocessed = notificationsToDelete.some(
      (n) => n.changeRequest?.status === "PENDING"
    );

    if (hasUnprocessed) {
      setIsConfirmingDelete(true);
    } else {
      await proceedWithDeletion();
    }
  };

  const proceedWithDeletion = async () => {
    const originalNotifications = [...notifications];
    const idsToDelete = Array.from(selectedIds);

    setNotifications((prev) => prev.filter((n) => !idsToDelete.includes(n.id)));
    setSelectedIds(new Set());
    if (selectedNotification && idsToDelete.includes(selectedNotification.id)) {
      setSelectedNotification(null);
    }

    try {
      await Promise.all(
        idsToDelete.map((id) =>
          fetch(`/api/notifications/${id}`, { method: "DELETE" })
        )
      );
      toast.success(`${idsToDelete.length} notification(s) deleted.`);
    } catch (error) {
      toast.error("Failed to delete notifications.");
      setNotifications(originalNotifications);
    }
    setIsConfirmingDelete(false);
  };

  const filteredNotifications = notifications
    .filter((n) => {
      if (filterStatus === "all") return true;
      if (!n.changeRequest) return filterStatus === "other";
      return n.changeRequest.status === filterStatus;
    })
    .filter((n) => {
      if (searchTerm === "") return true;
      const lowerSearchTerm = searchTerm.toLowerCase();

      const requesterName =
        n.changeRequest?.requester.name?.toLowerCase() || "";
      const requesterUsername =
        n.changeRequest?.requester.username?.toLowerCase() || "";
      const workspaceName = n.workspace?.name.toLowerCase() || "";
      const projectName = n.project?.name.toLowerCase() || "";

      return (
        requesterName.includes(lowerSearchTerm) ||
        requesterUsername.includes(lowerSearchTerm) ||
        workspaceName.includes(lowerSearchTerm) ||
        projectName.includes(lowerSearchTerm)
      );
    });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)]">
        <div
          className={cn(
            "w-full md:w-1/3 border-r overflow-y-auto",
            selectedNotification ? "hidden md:block" : "block"
          )}
        >
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Inbox</h2>
              <Button
                onClick={markAllAsRead}
                size="sm"
                variant="outline"
                disabled={!notifications.some((n) => !n.isRead)}
              >
                Mark all as read
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === filteredNotifications.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
              >
                Delete Selected
              </Button>
            </div>
          </div>
          <div className="divide-y">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start p-4 cursor-pointer hover:bg-gray-50 ${selectedNotification?.id === n.id ? "bg-gray-100" : ""
                  }`}
              >
                <Checkbox
                  className="mr-4 mt-1"
                  checked={selectedIds.has(n.id)}
                  onCheckedChange={() => handleSelect(n.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  className="flex-grow"
                  onClick={() => handleSelectNotification(n)}
                >
                  <div className="flex items-start">
                    {!n.isRead && (
                      <div className="h-2.5 w-2.5 bg-blue-500 rounded-full mr-3 mt-1.5"></div>
                    )}
                    <div className={n.isRead ? "pl-[22px]" : ""}>
                      <div className="flex justify-between">
                        <p
                          className={`font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-500"
                            }`}
                        >
                          <NotificationMessage notification={n} />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {n.workspace?.name}
                        {n.project && ` > ${n.project.name}`}
                      </div>
                      {n.changeRequest && n.changeRequest.status !== "PENDING" && (
                        <div className="mt-2">
                          {n.changeRequest.status === "APPROVED" && (
                            <Badge>已批准</Badge>
                          )}
                          {n.changeRequest.status === "REJECTED" && (
                            <Badge variant="destructive">已拒绝</Badge>
                          )}
                        </div>
                      )}
                      {n.changeRequest && n.changeRequest.status === "PENDING" && (
                        <div className="mt-2">
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            未处理
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredNotifications.length === 0 && !isLoading && (
              <p className="text-muted-foreground text-center py-8">
                No notifications match your criteria.
              </p>
            )}
            {notifications.length === 0 && !isLoading && (
              <p className="text-muted-foreground text-center py-8">
                No notifications yet.
              </p>
            )}
          </div>
        </div>

        <div
          className={cn(
            "w-full md:w-2/3 p-6",
            selectedNotification ? "block" : "hidden md:block"
          )}
        >
          {selectedNotification ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedNotification(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                      {selectedNotification.changeRequest
                        ? "Request Details"
                        : "Notification"}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleDeleteNotification(selectedNotification.id)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {selectedNotification.changeRequest && (
                  <CardDescription className="pt-2">
                    <Link
                      href={`/users/${selectedNotification.changeRequest.requester.id}`}
                      className="font-semibold hover:underline"
                    >
                      {selectedNotification.changeRequest.requester.name ||
                        selectedNotification.changeRequest.requester.username}
                    </Link>{" "}
                    from workspace{" "}
                    <Link
                      href={`/dashboard/workspaces/${selectedNotification.changeRequest.task.project.workspace.id}`}
                      className="font-semibold hover:underline"
                    >
                      {
                        selectedNotification.changeRequest.task.project
                          .workspace.name
                      }
                    </Link>{" "}
                    requested changes for task{" "}
                    <Link
                      href={`/dashboard/workspaces/${selectedNotification.changeRequest.task.project.workspace.id}/tasks?taskId=${selectedNotification.changeRequest.task.id}`}
                      className="font-semibold hover:underline"
                    >
                      {selectedNotification.changeRequest.task.name}
                    </Link>
                    .
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedNotification.changeRequest ? (
                  <>
                    <div className="grid gap-y-6">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">
                          Task
                        </h4>
                        <p className="text-base">
                          {selectedNotification.changeRequest.task.name}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">
                          Project
                        </h4>
                        <p className="text-base">
                          {
                            selectedNotification.changeRequest.task.project
                              .name
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-500">
                          Requested Change
                        </h4>
                        <div className="mt-2 space-y-4 rounded-lg border bg-slate-50 p-4">
                          {selectedNotification.changeRequest.newStatus ? (
                            <div>
                              <p className="font-medium">Status Change</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {
                                    selectedNotification.changeRequest
                                      .originalStatus
                                  }
                                </Badge>
                                <span>→</span>
                                <Badge>
                                  {
                                    selectedNotification.changeRequest
                                      .newStatus
                                  }
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">Status Change</p>
                              <p className="text-sm text-gray-500">
                                No status change requested.
                              </p>
                            </div>
                          )}
                          <hr />
                          {selectedNotification.changeRequest.newDueDate ? (
                            <div>
                              <p className="font-medium">New Due Date</p>
                              <p>
                                {new Date(
                                  selectedNotification.changeRequest.newDueDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">New Due Date</p>
                              <p className="text-sm text-gray-500">
                                No due date change requested.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedNotification.changeRequest.reason && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500">
                            Reason for Request
                          </h4>
                          <p className="mt-2 rounded-lg border bg-slate-50 p-4 text-sm">
                            {selectedNotification.changeRequest.reason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 mt-6 border-t">
                      {selectedNotification.changeRequest.status ===
                        "PENDING" ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleAction(
                                selectedNotification.id,
                                selectedNotification.changeRequest!.id,
                                "APPROVED"
                              )
                            }
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleAction(
                                selectedNotification.id,
                                selectedNotification.changeRequest!.id,
                                "REJECTED"
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-semibold">Status:</h4>
                          <Badge
                            variant={
                              selectedNotification.changeRequest.status ===
                                "APPROVED"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {selectedNotification.changeRequest.status}
                          </Badge>
                          {selectedNotification.changeRequest.processor && (
                            <p className="text-sm text-gray-500 mt-2">
                              Processed by{" "}
                              {selectedNotification.changeRequest.processor
                                .name ||
                                selectedNotification.changeRequest.processor
                                  .username}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm">
                    <NotificationMessage notification={selectedNotification} />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
              Select a notification to view details.
            </div>
          )}
        </div>
      </div>
      <AlertDialog
        open={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete unprocessed notification(s). This action
              cannot be undone. If you have already coordinated with the parties
              involved, please disregard this warning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithDeletion}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const NotificationMessage = ({
  notification,
}: {
  notification: Notification;
}) => {
  const { actor, task, project, workspace } = notification;

  if (notification.message.includes("assigned")) {
    return (
      <span>
        <Link
          href={`/users/${actor?.id}`}
          className="font-bold hover:underline"
        >
          {actor?.name || actor?.username}
        </Link>{" "}
        assigned you a new task:{" "}
        <Link
          href={`/dashboard/workspaces/${workspace?.id}/tasks?taskId=${task?.id}`}
          className="font-bold hover:underline"
        >
          {task?.name}
        </Link>{" "}
        in project{" "}
        <Link
          href={`/dashboard/workspaces/${workspace?.id}/projects/${project?.id}`}
          className="font-bold hover:underline"
        >
          {project?.name}
        </Link>
        .
      </span>
    );
  }

  if (notification.message.includes("request")) {
    const status = notification.message.includes("approved")
      ? "approved"
      : "rejected";
    return (
      <span>
        Your change request for task{" "}
        <Link
          href={`/dashboard/workspaces/${workspace?.id}/tasks?taskId=${task?.id}`}
          className="font-bold hover:underline"
        >
          {task?.name}
        </Link>{" "}
        has been {status} by{" "}
        <Link
          href={`/users/${actor?.id}`}
          className="font-bold hover:underline"
        >
          {actor?.name || actor?.username}
        </Link>
        .
      </span>
    );
  }

  return <span>{notification.message}</span>;
}; 