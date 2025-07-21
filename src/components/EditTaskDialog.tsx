"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface EditTaskDialogProps {
  task: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    assignee?: {
      id: string;
      name?: string | null;
      username: string;
    } | null;
  };
  workspaceId: string;
  projectId: string;
  onTaskUpdated: () => void;
  workspaceUsers: any[];
}

interface WorkspaceUser {
  id: string;
  name?: string | null;
  username: string;
  role?: string;
}

export function EditTaskDialog({
  task,
  workspaceId,
  projectId,
  onTaskUpdated,
  workspaceUsers,
}: EditTaskDialogProps) {
  const [open, setOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [date, setDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || "");
  const [selectedUser, setSelectedUser] = useState<WorkspaceUser | null>(null);

  useEffect(() => {
    setName(task.name);
    setDescription(task.description || "");
    setStatus(task.status);
    setDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setAssigneeId(task.assigneeId || "");
  }, [task]);

  // Set selected user based on assigneeId
  useEffect(() => {
    if (assigneeId && workspaceUsers.length > 0) {
      const user = workspaceUsers.find(u => u.id === assigneeId);
      if (user) {
        setSelectedUser(user);
      }
    } else if (task.assignee) {
      setSelectedUser(task.assignee);
    }
  }, [assigneeId, workspaceUsers, task.assignee]);

  const handleSelectAssignee = (user: WorkspaceUser) => {
    setAssigneeId(user.id);
    setSelectedUser(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("任务名称不能为空");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          status,
          dueDate: date ? date.toISOString() : undefined,
          assigneeId: assigneeId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新任务失败");
      }

      toast.success("任务更新成功");
      setOpen(false);
      onTaskUpdated();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("更新任务失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setOpen(false);
        onTaskUpdated();
      } else {
        setOpen(true);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>修改任务</DialogTitle>
            <DialogDescription>
              修改任务详情
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                任务名称
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入任务名称"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                描述
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="任务描述（可选）"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="status" className="text-sm font-medium">
                  状态
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog">待处理</SelectItem>
                    <SelectItem value="Todo">待办</SelectItem>
                    <SelectItem value="In Progress">进行中</SelectItem>
                    <SelectItem value="In Review">审核中</SelectItem>
                    <SelectItem value="Done">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  截止日期
                </label>
                <DateTimePicker
                  date={date}
                  setDate={setDate}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="assignee" className="text-sm font-medium">
                负责人
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {selectedUser ? (
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>
                            {selectedUser.name?.[0] || selectedUser.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedUser.name || selectedUser.username}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>选择负责人</span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuLabel>工作区成员</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setAssigneeId("");
                      setSelectedUser(null);
                    }}
                  >
                    <span className="text-muted-foreground">未分配</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {workspaceUsers.length > 0 ? (
                    workspaceUsers.map((user) => (
                      <DropdownMenuItem
                        key={user.id}
                        onClick={() => handleSelectAssignee(user)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback>
                              {user.name?.[0] || user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {user.name || user.username}
                            {user.role === "owner" && (
                              <span className="text-xs text-muted-foreground ml-2">(所有者)</span>
                            )}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>无可用成员</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 