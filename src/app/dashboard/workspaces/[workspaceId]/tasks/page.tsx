"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { differenceInDays, format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { RequestChangeDialog } from "@/components/RequestChangeDialog";
import { TaskDetailsDialog } from "@/components/TaskDetailsDialog";

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

const statusColors: { [key: string]: string } = {
  Backlog: "bg-pink-100 text-pink-700",
  Todo: "bg-red-100 text-red-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  "In Review": "bg-blue-100 text-blue-700",
  Done: "bg-emerald-100 text-emerald-700",
};

export default function MyTasksPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRequestSubmitted = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: 'In Review' } : task
      )
    );
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (!workspaceId) return;
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [workspaceId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!workspaceId) return;
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/tasks`);
        if (response.ok) {
          const newTasks = await response.json();
          if (newTasks.length > tasks.length) {
            const newAssignedTasks = newTasks.filter(
              (nt: Task) => !tasks.some(ot => ot.id === nt.id)
            );
            newAssignedTasks.forEach((task: Task) => {
              toast.info(`You have been assigned a new task: "${task.name}"`);
            });
          }
          setTasks(newTasks);
        }
      } catch (error) {
        console.error("Failed to poll for new tasks:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [workspaceId, tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const DueDate = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return <span className="text-muted-foreground">-</span>;
    const days = differenceInDays(new Date(dueDate), new Date());
    let color = "text-muted-foreground";
    if (days < 0) color = "text-red-500";
    else if (days < 7) color = "text-yellow-600";
    return (
      <span className={color}>
        {format(new Date(dueDate), "MMM dd, yyyy")}
      </span>
    );
  };

  if (isLoading) {
    return <div className="p-8">Loading your tasks...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer">
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.project.name}</TableCell>
                <TableCell>
                  <DueDate dueDate={task.dueDate} />
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[task.status] || "bg-gray-100 text-gray-700"}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {task.assignees.map(assignee => (
                      <Avatar key={assignee.id} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback>
                          {assignee.name?.[0] || assignee.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <RequestChangeDialog
                    task={task}
                    workspaceId={workspaceId}
                    onRequestSubmitted={() => handleRequestSubmitted(task.id)}
                  >
                    <Button variant="outline" size="sm">
                      Request Change
                    </Button>
                  </RequestChangeDialog>
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  You have no assigned tasks in this workspace.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
