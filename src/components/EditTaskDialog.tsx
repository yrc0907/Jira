"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  assignees: {
    id: string;
    name?: string | null;
    username: string;
  }[];
}

interface User {
  id: string;
  name?: string | null;
  username: string;
}

interface EditTaskDialogProps {
  task: Task;
  workspaceId: string;
  projectId: string;
  onTaskUpdated: () => void;
  workspaceUsers: User[];
}

export function EditTaskDialog({
  task,
  workspaceId,
  projectId,
  onTaskUpdated,
  workspaceUsers,
}: EditTaskDialogProps) {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split("T")[0] : "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assignees.map(a => a.id));

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(task.name);
    setDescription(task.description || "");
    setStatus(task.status);
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setAssigneeIds(task.assignees.map(a => a.id));
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            status,
            dueDate,
            assigneeIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast.success("Task updated successfully");
      onTaskUpdated();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssigneeChange = (userId: string) => {
    setAssigneeIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };


  return (
    <Dialog open={!!task} onOpenChange={() => onTaskUpdated()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Task Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backlog">Backlog</SelectItem>
                  <SelectItem value="Todo">Todo</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Assignees</Label>
              <ScrollArea className="h-40 rounded-md border p-2">
                {workspaceUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`assignee-${user.id}`}
                      checked={assigneeIds.includes(user.id)}
                      onCheckedChange={() => handleAssigneeChange(user.id)}
                    />
                    <Label htmlFor={`assignee-${user.id}`}>{user.name || user.username}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 