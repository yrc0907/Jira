"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddMemberDialogProps {
  workspaceId: string;
  onMemberAdded?: () => void;
  variant?: "default" | "outline";
  size?: "default" | "sm";
}

export function AddMemberDialog({
  workspaceId,
  onMemberAdded,
  variant = "default",
  size = "default",
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("用户名不能为空");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "添加成员失败");
      }

      toast.success("成员添加成功");
      setOpen(false);
      setUsername("");
      if (onMemberAdded) onMemberAdded();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "添加成员失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <UserPlus className="mr-2 h-4 w-4" />
          添加成员
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>添加工作区成员</DialogTitle>
            <DialogDescription>
              输入用户名添加成员到当前工作区
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                用户名
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                required
              />
              <p className="text-xs text-muted-foreground">
                添加的用户需要已在系统中注册
              </p>
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
              添加
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 