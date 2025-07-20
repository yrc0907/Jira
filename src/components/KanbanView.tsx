"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { Button } from "@/components/ui/button";

// Add a new style for the drop animation
const dropAnimation = `
  @keyframes dropIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .drop-in {
    animation: dropIn 0.3s ease-out;
  }
`;

// Add the style to the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = dropAnimation;
  document.head.appendChild(styleSheet);
}


const statusMap: Record<string, string> = {
  "Backlog": "待处理",
  "Todo": "待办",
  "In Progress": "进行中",
  "In Review": "审核中",
  "Done": "已完成"
};

const statusColors: Record<string, string> = {
  "Backlog": "bg-pink-500",
  "Todo": "bg-red-500",
  "In Progress": "bg-yellow-500",
  "In Review": "bg-blue-500",
  "Done": "bg-emerald-500",
};


const TaskCard = ({ task, isOverlay, onEditClick }: { task: any, isOverlay?: boolean, onEditClick: (task: any) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { ...task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardClasses = cn(
    "bg-white p-3 rounded-lg border shadow-sm mb-3",
    isDragging && "opacity-50",
    isOverlay && "shadow-xl"
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
    >
      <div className="flex justify-between items-start">
        <span className="font-medium text-sm">{task.name}</span>
        <div className="flex items-center">
          <button {...attributes} {...listeners} className="cursor-grab p-1" aria-label="Drag task">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditClick(task)}>
                修改
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center">
          {task.assignee ? (
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mr-1.5 text-xs font-medium">
                {task.assignee.name?.[0] || task.assignee.username[0].toUpperCase()}
              </div>
              <span>{task.assignee.name || task.assignee.username}</span>
            </div>
          ) : (
            <span>未分配</span>
          )}
        </div>
        {task.dueDate && (
          <span className="text-amber-600">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ id, status, tasks, onEditClick }: { id: UniqueIdentifier, status: string, tasks: any[], onEditClick: (task: any) => void }) => {
  const { setNodeRef } = useSortable({ id });
  return (
    <div ref={setNodeRef} className="bg-gray-50 rounded-lg p-3 w-72 flex-shrink-0">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className={`w-2.5 h-2.5 rounded-full mr-2 ${statusColors[status] || 'bg-gray-400'}`}></div>
          <h3 className="font-semibold text-sm">{statusMap[status] || status}</h3>
          <span className="text-xs text-gray-400 ml-2">{tasks.length}</span>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600" aria-label="Add task to column">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[100px]">
          {tasks.map(task => <TaskCard key={task.id} task={task} onEditClick={onEditClick} />)}
        </div>
      </SortableContext>
    </div>
  );
};

export function KanbanView({ tasks, workspaceId, projectId, onTaskUpdated, workspaceUsers }: {
  tasks: any[];
  workspaceId: string;
  projectId: string;
  onTaskUpdated: () => void;
  workspaceUsers: any[];
}) {
  const [taskItems, setTaskItems] = useState(tasks);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setTaskItems(tasks);
  }, [tasks]);

  const handleEditClick = (task: any) => {
    setEditingTask(task);
  };

  const handleTaskUpdated = () => {
    onTaskUpdated();
    setEditingTask(null);
  };

  const columns = useMemo(() => {
    const groupedTasks: { [key: string]: any[] } = {};
    Object.keys(statusMap).forEach(status => {
      groupedTasks[status] = [];
    });
    taskItems.forEach(task => {
      if (groupedTasks[task.status]) {
        groupedTasks[task.status].push(task);
      }
    });
    return groupedTasks;
  }, [taskItems]);

  const findColumnWithTask = (taskId: UniqueIdentifier) => {
    return Object.keys(columns).find(status => columns[status].some(task => task.id === taskId));
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = taskItems.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const originalStatus = findColumnWithTask(activeId);
    let overColumnStatus = Object.keys(statusMap).find(status => status === overId);
    if (!overColumnStatus) {
      overColumnStatus = findColumnWithTask(overId);
    }

    if (!overColumnStatus || !originalStatus || originalStatus === overColumnStatus) {
      return;
    }

    // Optimistic update
    const originalTasks = [...taskItems];
    const updatedTasks = taskItems.map(t =>
      t.id === activeId ? { ...t, status: overColumnStatus } : t
    );
    setTaskItems(updatedTasks);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: overColumnStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      toast.success('任务状态已更新');
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('更新任务状态失败');
      setTaskItems(originalTasks);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(columns).map(([status, tasksInColumn]) => (
            <KanbanColumn key={status} id={status} status={status} tasks={tasksInColumn} onEditClick={handleEditClick} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay onEditClick={() => { }} /> : null}
        </DragOverlay>
      </DndContext>
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          workspaceId={workspaceId}
          projectId={projectId}
          onTaskUpdated={handleTaskUpdated}
          workspaceUsers={workspaceUsers}
        />
      )}
    </>
  );
}
