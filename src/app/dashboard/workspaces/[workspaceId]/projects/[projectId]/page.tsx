"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, Calendar, ChevronDown, Filter, MoreVertical, Plus, User, Users } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

const StatusBadge = ({ status }: { status: string }) => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>("table");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [inlineEditingTaskId, setInlineEditingTaskId] = useState<string | null>(null);
  const [inlineTaskName, setInlineTaskName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((task) => task.id));
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
    <div className="flex flex-col h-full">
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
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            所有状态
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            所有负责人 ({workspaceUsers.length})
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            截止日期
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* 表格视图 */}
      {activeView === "table" && (
        <div className="bg-white border rounded-lg overflow-hidden">
          {isLoadingTasks ? (
            <div className="p-8 text-center">
              <p>加载任务中...</p>
            </div>
          ) : tasks.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTasks.length === tasks.length && tasks.length > 0}
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
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
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
                              <TooltipProvider>
                                {task.assignees.map(assignee => (
                                  <Tooltip key={assignee.id}>
                                    <TooltipTrigger asChild>
                                      <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white transition-all duration-300 hover:scale-150 hover:mx-1 hover:z-10 cursor-pointer">
                                        {assignee.name?.[0] || assignee.username[0].toUpperCase()}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{assignee.name || assignee.username}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className="text-gray-400">未分配</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <span className="text-amber-600">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">无截止日期</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
                <div>已选择 {selectedTasks.length} / {tasks.length} 个任务</div>
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
          tasks={tasks}
          workspaceId={workspaceId}
          projectId={projectId}
          onTaskUpdated={fetchTasks}
          workspaceUsers={workspaceUsers}
        />
      )}

      {/* 日历视图 */}
      {activeView === "calendar" && <CalendarView tasks={tasks} />}

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
  );
} 