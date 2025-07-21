"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DatePicker } from "./ui/date-picker";

interface CreateTaskDialogProps {
  workspaceId: string;
  projectId: string;
  onTaskCreated?: () => void;
}

interface WorkspaceUser {
  id: string;
  name?: string | null;
  username: string;
  role?: string;
}

export function CreateTaskDialog({
  workspaceId,
  projectId,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const currentUser = session?.user;
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Backlog");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<WorkspaceUser | null>(null);

  // Fetch workspace users when dialog opens
  useEffect(() => {
    if (open && workspaceId) {
      fetchWorkspaceUsers();
    }
  }, [open, workspaceId]);

  // Set current user as default assignee once users are loaded
  useEffect(() => {
    if (workspaceUsers.length > 0 && currentUser && !assigneeId) {
      setAssigneeId(currentUser.id);
      const user = workspaceUsers.find(u => u.id === currentUser.id);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [workspaceUsers, currentUser, assigneeId]);

  const fetchWorkspaceUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch workspace users');
      }
      const data = await response.json();
      setWorkspaceUsers(data);
    } catch (error) {
      console.error("Error fetching workspace users:", error);
      toast.error("获取工作区成员失败");
    } finally {
      setLoadingUsers(false);
    }
  };

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
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          status,
          dueDate: date ? date.toISOString() : undefined,
          assigneeId: assigneeId || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "创建任务失败");
      }

      toast.success("任务创建成功");
      setOpen(false);
      resetForm();
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("创建任务失败");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("Backlog");
    setDate(undefined);
    setAssigneeId("");
    setSelectedUser(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新建任务
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>创建任务</DialogTitle>
            <DialogDescription>
              在项目中添加新任务
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
                <DatePicker
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
                    ) : loadingUsers ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>加载中...</span>
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
                  <DropdownMenuSeparator />
                  {loadingUsers ? (
                    <DropdownMenuItem disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      加载中...
                    </DropdownMenuItem>
                  ) : workspaceUsers.length > 0 ? (
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
              创建任务
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 