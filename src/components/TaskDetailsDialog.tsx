"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  project: {
    name: string;
  };
  assignees: {
    id: string;
    name: string | null;
    username: string;
  }[];
}

interface TaskDetailsDialogProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const TaskDetailsDialog = ({ task, isOpen, onOpenChange }: TaskDetailsDialogProps) => {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
          <DialogDescription>
            In project <span className="font-semibold">{task.project.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div>
            <h4 className="font-semibold text-sm text-gray-500 mb-2">Status</h4>
            <Badge>{task.status}</Badge>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-500 mb-2">Due Date</h4>
            <p>{task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-500 mb-2">Assignees</h4>
            <div className="flex flex-wrap gap-2">
              {task.assignees.map(assignee => (
                <Badge key={assignee.id} variant="outline">{assignee.name || assignee.username}</Badge>
              ))}
              {task.assignees.length === 0 && <p className="text-sm text-gray-500">Not assigned</p>}
            </div>
          </div>
          {task.description && (
            <div>
              <h4 className="font-semibold text-sm text-gray-500 mb-2">Description</h4>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>{task.description}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 