"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, Calendar as CalendarIcon, ChevronDown, Filter, MoreVertical, Plus, User, Users, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { KanbanView } from "@/components/KanbanView";
import { CalendarView } from "@/components/CalendarView";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { ProjectStatsCards } from "@/components/ProjectStatsCards";
import { TaskTrendChart } from "@/components/TaskTrendChart";
import { UserTaskChart } from "@/components/UserTaskChart";

function DraggableAvatar({ user }: { user: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: user.id,
    data: { user },
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white cursor-pointer">
              {user.name?.[0] || user.username[0].toUpperCase()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.name || user.username}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// New component for avatars within task rows
function TaskAssigneeAvatar({ user, task, onRemove }: { user: any; task: Task; onRemove: (taskId: string, userId: string) => void; }) {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${task.id}-${user.id}`,
    data: { user, fromTask: task.id },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100, // Ensure dragged avatar is on top
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white transition-all duration-300 hover:scale-150 hover:mx-2 hover:z-10 cursor-pointer">
              {user.name?.[0] || user.username[0].toUpperCase()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{user.name || user.username}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isHovered && (
        <button
          onClick={() => onRemove(task.id, user.id)}
          className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs z-20 hover:bg-red-500 transition-colors"
          aria-label="Remove assignee"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}


function DroppableTaskRow({ task, children, onAssigneeDrop }: { task: Task, children: React.ReactNode, onAssigneeDrop: (taskId: string, user: any) => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: task.id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(0, 0, 255, 0.05)' : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {children}
    </TableRow>
  );
}


interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  assignees: {
    id: string;
    name?: string | null;
    username: string;
  }[];
}

type ViewType = "table" | "kanban" | "calendar";

const StatusBadge = ({ status, onUpdate }: { status: string; onUpdate?: (newStatus: string) => void }) => {
  // 状态名称映射
  const statusMap: Record<string, string> = {
    "Backlog": "待处理",
    "Todo": "待办",
    "In Progress": "进行中",
    "In Review": "审核中",
    "Done": "已完成"
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Backlog":
        return "bg-pink-100 text-pink-700 hover:bg-pink-100";
      case "Todo":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "In Review":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "In Progress":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      case "Done":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  if (onUpdate) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge className={`${getStatusColor(status)} font-medium cursor-pointer`}>
            {statusMap[status] || status}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.entries(statusMap).map(([key, value]) => (
            <DropdownMenuItem key={key} onSelect={() => onUpdate(key)}>
              {value}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Badge className={`${getStatusColor(status)} font-medium`}>
      {statusMap[status] || status}
    </Badge>
  );
};

function TaskActionsMenu({ task, workspaceId, projectId, onTaskDeleted, onEditClick, workspaceUsers }: {
  task: Task;
  workspaceId: string;
  projectId: string;
  onTaskDeleted: () => void;
  onEditClick: (task: Task) => void;
  workspaceUsers: any[];
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('确定要删除此任务吗？')) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('删除任务失败');
        }

        toast.success('任务已删除');
        onTaskDeleted();
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('删除任务失败');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEditClick(task)}>
          修改
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [inlineEditingTaskId, setInlineEditingTaskId] = useState<string | null>(null);
  const [inlineTaskName, setInlineTaskName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previousTaskCount, setPreviousTaskCount] = useState<number | undefined>(undefined);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState<{
    type: 'before' | 'after' | 'on' | null,
    date: Date | null
  }>({
    type: null,
    date: null
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const filteredAssignees = useMemo(() => {
    if (!assigneeSearch) return workspaceUsers;
    return workspaceUsers.filter(user =>
      user.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      user.username.toLowerCase().includes(assigneeSearch.toLowerCase())
    );
  }, [workspaceUsers, assigneeSearch]);

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, ...data } : t);
    setTasks(updatedTasks);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      setTasks(originalTasks);
    }
  };

  const handleRemoveAssignee = (taskId: string, assigneeIdToRemove: string) => {
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          assignees: task.assignees.filter(a => a.id !== assigneeIdToRemove)
        };
      }
      return task;
    });
    setTasks(updatedTasks);

    const taskToUpdate = updatedTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    const assigneeIds = taskToUpdate.assignees.map(a => a.id);

    fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeIds }),
    }).then(response => {
      if (!response.ok) {
        setTasks(originalTasks);
        toast.error("Failed to remove assignee.");
      } else {
        toast.success("Assignee removed.");
      }
    }).catch(() => {
      setTasks(originalTasks);
      toast.error("An error occurred while removing the assignee.");
    });
  };

  const handleDragEnd = (event: any) => {
    const { over, active } = event;
    if (over && active) {
      const { user, fromTask } = active.data.current;
      const toTask = over.id;

      // Prevent dropping on the same task if user is already assigned
      if (fromTask === toTask) return;

      const taskToUpdate = tasks.find(t => t.id === toTask);
      if (taskToUpdate?.assignees.some(a => a.id === user.id)) {
        toast.info("User is already assigned to this task.");
        return;
      }

      const originalTasks = [...tasks];

      // Optimistic update
      const updatedTasks = tasks.map(task => {
        // Remove from old task
        if (task.id === fromTask) {
          return { ...task, assignees: task.assignees.filter(a => a.id !== user.id) };
        }
        // Add to new task
        if (task.id === toTask) {
          return { ...task, assignees: [...task.assignees, user] };
        }
        return task;
      });
      setTasks(updatedTasks);

      // API calls
      const fromTaskUpdate = updatedTasks.find(t => t.id === fromTask);
      const toTaskUpdate = updatedTasks.find(t => t.id === toTask);

      const fromTaskAssigneeIds = fromTaskUpdate?.assignees.map(a => a.id) || [];
      const toTaskAssigneeIds = toTaskUpdate?.assignees.map(a => a.id) || [];

      Promise.all([
        fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${fromTask}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigneeIds: fromTaskAssigneeIds }),
        }),
        fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${toTask}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigneeIds: toTaskAssigneeIds }),
        })
      ]).then(async ([fromResponse, toResponse]) => {
        if (!fromResponse.ok || !toResponse.ok) {
          setTasks(originalTasks);
          toast.error("Failed to reassign task.");
        } else {
          toast.success("Task reassigned successfully!");
        }
      }).catch(error => {
        console.error(error);
        setTasks(originalTasks);
        toast.error("An error occurred during reassignment.");
      });
    }
  };

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("加载任务失败");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleStartInlineEdit = (task: Task) => {
    setInlineEditingTaskId(task.id);
    setInlineTaskName(task.name);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingTaskId(null);
    setInlineTaskName("");
  };

  const handleSaveInlineEdit = async (taskId: string) => {
    if (isSaving) return;

    if (!inlineTaskName.trim()) {
      toast.error("任务名称不能为空");
      handleCancelInlineEdit();
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: inlineTaskName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task name');
      }

      toast.success('任务名称已更新');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task name:', error);
      toast.error('更新任务名称失败');
    } finally {
      handleCancelInlineEdit();
      setIsSaving(false);
    }
  };


  const fetchWorkspaceMembers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/users`);
      if (response.ok) {
        const data = await response.json();
        setWorkspaceUsers(data);
      }
    } catch (error) {
      console.error("Error fetching workspace members:", error);
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return router.push("/404");
          } else if (response.status === 401) {
            return router.push("/login");
          }
          throw new Error(`Failed to fetch project: ${response.status}`);
        }

        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("加载项目详情失败");
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId && projectId) {
      fetchProject();
      fetchTasks();
      fetchWorkspaceMembers();
    }
  }, [workspaceId, projectId, router]);

  useEffect(() => {
    if (tasks.length > 0) {
      let filtered = [...tasks];

      // Filter by status
      if (statusFilter) {
        filtered = filtered.filter(task => task.status === statusFilter);
      }

      // Filter by assignee
      if (assigneeFilter) {
        filtered = filtered.filter(task =>
          task.assignees.some(assignee => assignee.id === assigneeFilter)
        );
      }

      // Filter by due date
      if (dueDateFilter.type && dueDateFilter.date) {
        const filterDate = new Date(dueDateFilter.date);
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);

          switch (dueDateFilter.type) {
            case 'before':
              return taskDate < filterDate;
            case 'after':
              return taskDate > filterDate;
            case 'on':
              return (
                taskDate.getFullYear() === filterDate.getFullYear() &&
                taskDate.getMonth() === filterDate.getMonth() &&
                taskDate.getDate() === filterDate.getDate()
              );
            default:
              return true;
          }
        });
      }

      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter(task =>
          task.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFilteredTasks(filtered);
    } else {
      setFilteredTasks([]);
    }
  }, [tasks, statusFilter, assigneeFilter, dueDateFilter, searchQuery]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map((task) => task.id));
    }
  };

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const handleMemberAdded = () => {
    fetchWorkspaceMembers();
    toast.success("成员已添加到工作区");
  };

  const handleDeleteTask = () => {
    fetchTasks();
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setEditingTask(null);
  };

  if (isLoading) {
    return <div className="p-8">加载项目中...</div>;
  }

  if (!project) {
    return <div className="p-8">未找到项目</div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/settings`}>
                <Settings className="h-4 w-4 mr-1" />
                设置
              </Link>
            </Button>
            <AddMemberDialog
              workspaceId={workspaceId}
              onMemberAdded={handleMemberAdded}
              variant="outline"
              size="sm"
            />
            <CreateTaskDialog
              workspaceId={workspaceId}
              projectId={projectId}
              onTaskCreated={handleTaskCreated}
            />
          </div>
        </div>

        <ProjectStatsCards tasks={tasks} previousTaskCount={previousTaskCount} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TaskTrendChart tasks={tasks} />
          <UserTaskChart tasks={tasks} users={workspaceUsers} />
        </div>

        {/* 视图选择器 */}
        <div className="bg-gray-50 rounded-lg mb-6">
          <div className="flex flex-wrap border-b">
            <Button
              variant={activeView === "table" ? "secondary" : "ghost"}
              onClick={() => setActiveView("table")}
              className="rounded-none rounded-tl-lg border-0"
            >
              表格
            </Button>
            <Button
              variant={activeView === "kanban" ? "secondary" : "ghost"}
              onClick={() => setActiveView("kanban")}
              className="rounded-none border-0"
            >
              看板
            </Button>
            <Button
              variant={activeView === "calendar" ? "secondary" : "ghost"}
              onClick={() => setActiveView("calendar")}
              className="rounded-none border-0"
            >
              日历
            </Button>
          </div>

          {/* 筛选器 */}
          <div className="p-4 flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by task name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  {statusFilter ? statusFilter : "所有状态"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  所有状态
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Backlog")}>
                  待处理
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Todo")}>
                  待办
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("In Progress")}>
                  进行中
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("In Review")}>
                  审核中
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Done")}>
                  已完成
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {assigneeFilter
                    ? workspaceUsers.find(user => user.id === assigneeFilter)?.name || '已选择负责人'
                    : `所有负责人 (${workspaceUsers.length})`}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-2">
                  <Input
                    placeholder="Search assignee..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAssigneeFilter(null)}>
                  所有负责人
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {filteredAssignees.map(user => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => setAssigneeFilter(user.id)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                      {user.name?.[0] || user.username[0].toUpperCase()}
                    </div>
                    <span>{user.name || user.username}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {dueDateFilter.type
                    ? `截止日期 ${dueDateFilter.type === 'before' ? '早于' : dueDateFilter.type === 'after' ? '晚于' : '是'} ${dueDateFilter.date?.toLocaleDateString()}`
                    : "截止日期"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <div className="p-2">
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <Button
                        variant={dueDateFilter.type === 'before' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDueDateFilter(prev => ({ ...prev, type: 'before' }))}
                        className="flex-1"
                      >
                        早于
                      </Button>
                      <Button
                        variant={dueDateFilter.type === 'on' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDueDateFilter(prev => ({ ...prev, type: 'on' }))}
                        className="flex-1"
                      >
                        在当天
                      </Button>
                      <Button
                        variant={dueDateFilter.type === 'after' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDueDateFilter(prev => ({ ...prev, type: 'after' }))}
                        className="flex-1"
                      >
                        晚于
                      </Button>
                    </div>
                  </div>

                  <DatePicker
                    date={dueDateFilter.date || undefined}
                    setDate={(date) => setDueDateFilter(prev => ({ ...prev, date: date || null }))}
                  />

                  <div className="flex justify-between mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDueDateFilter({ type: null, date: null })}
                    >
                      清除
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!dueDateFilter.type) {
                          setDueDateFilter(prev => ({ ...prev, type: 'on' }));
                        }
                      }}
                      disabled={!dueDateFilter.date}
                    >
                      应用
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {(statusFilter || assigneeFilter || dueDateFilter.type) && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  setStatusFilter(null);
                  setAssigneeFilter(null);
                  setDueDateFilter({ type: null, date: null });
                  setSearchQuery("");
                  setAssigneeSearch("");
                }}
              >
                <X className="h-4 w-4" />
                清除所有筛选
              </Button>
            )}
          </div>
        </div>

        {/* 表格视图 */}
        {activeView === "table" && (
          <div className="bg-white border rounded-lg overflow-hidden">
            {isLoadingTasks ? (
              <div className="p-8 text-center">
                <p>加载任务中...</p>
              </div>
            ) : filteredTasks.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="min-w-[180px]">任务名称</TableHead>
                        <TableHead className="min-w-[120px]">负责人</TableHead>
                        <TableHead className="min-w-[150px]">截止日期</TableHead>
                        <TableHead className="min-w-[120px]">状态</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <DroppableTaskRow key={task.id} task={task} onAssigneeDrop={(taskId, user) => { }}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTasks.includes(task.id)}
                              onCheckedChange={() => toggleTaskSelection(task.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {inlineEditingTaskId === task.id ? (
                              <input
                                type="text"
                                value={inlineTaskName}
                                onChange={(e) => setInlineTaskName(e.target.value)}
                                onBlur={() => handleSaveInlineEdit(task.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveInlineEdit(task.id);
                                  }
                                  if (e.key === 'Escape') handleCancelInlineEdit();
                                }}
                                className="bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 w-full"
                                autoFocus
                                title="Task Name"
                                placeholder="Enter task name"
                              />
                            ) : (
                              <span onClick={() => handleStartInlineEdit(task)} className="cursor-pointer">
                                {task.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.assignees.length > 0 ? (
                              <div className="flex items-center -space-x-2">
                                {task.assignees.map(assignee => (
                                  <TaskAssigneeAvatar
                                    key={assignee.id}
                                    user={assignee}
                                    task={task}
                                    onRemove={handleRemoveAssignee}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">未分配</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="w-[240px]">
                              <DatePicker
                                date={task.dueDate ? new Date(task.dueDate) : undefined}
                                setDate={(date) =>
                                  handleUpdateTask(task.id, { dueDate: date?.toISOString() })
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={task.status}
                              onUpdate={(newStatus) => handleUpdateTask(task.id, { status: newStatus })}
                            />
                          </TableCell>
                          <TableCell>
                            <TaskActionsMenu
                              task={task}
                              workspaceId={workspaceId}
                              projectId={projectId}
                              onTaskDeleted={handleDeleteTask}
                              onEditClick={handleEditClick}
                              workspaceUsers={workspaceUsers}
                            />
                          </TableCell>
                        </DroppableTaskRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <div>已选择 {selectedTasks.length} / {filteredTasks.length} 个任务</div>
                  <div className="flex items-center">
                    <Button variant="outline" size="sm" className="mr-2" disabled>
                      上一页
                    </Button>
                    <Button variant="outline" size="sm">
                      下一页
                    </Button>
                  </div>
                </div>
              </>
            ) : tasks.length > 0 ? (
              <div className="text-center p-8">
                <p className="text-gray-500">没有找到符合条件的任务</p>
                <p className="text-sm text-gray-400 mt-1">
                  请尝试调整筛选条件
                </p>
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="text-gray-500">没有找到任务</p>
                <p className="text-sm text-gray-400 mt-1">
                  创建一个新任务开始使用
                </p>
              </div>
            )}
          </div>
        )}

        {/* 看板视图 */}
        {activeView === "kanban" && (
          <KanbanView
            tasks={filteredTasks}
            workspaceId={workspaceId}
            projectId={projectId}
            onTaskUpdated={handleTaskUpdated}
            workspaceUsers={workspaceUsers}
          />
        )}

        {/* 日历视图 */}
        {activeView === "calendar" && <CalendarView tasks={filteredTasks} />}

        {editingTask && (
          <EditTaskDialog
            task={editingTask}
            workspaceId={workspaceId}
            projectId={projectId}
            onTaskUpdated={handleTaskUpdated}
            workspaceUsers={workspaceUsers}
          />
        )}
      </div>
    </DndContext>
  );
} 