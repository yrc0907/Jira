"use client";

import { useState, useEffect } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define Task interface to match the structure from page.tsx
interface Task {
  id: string;
  name: string;
  status: string;
  dueDate?: string | null;
  assignee?: {
    name?: string | null;
    username: string;
  } | null;
}

const statusColors: Record<string, string> = {
  "Backlog": "border-l-4 border-pink-500",
  "Todo": "border-l-4 border-red-500",
  "In Progress": "border-l-4 border-yellow-500",
  "In Review": "border-l-4 border-blue-500",
  "Done": "border-l-4 border-emerald-500",
};

const TaskCard = ({ task }: { task: Task }) => (
  <div className={`px-2 py-1 mb-1 rounded text-xs bg-white shadow-sm hover:shadow-md transition-shadow ${statusColors[task.status] || 'border-l-4 border-gray-400'}`}>
    <p className="font-medium truncate">{task.name}</p>
    <div className="flex items-center mt-1 space-x-1">
      {task.assignee && (
        <div title={task.assignee.name || task.assignee.username} className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">
          {task.assignee.name?.[0] || task.assignee.username[0].toUpperCase()}
        </div>
      )}
    </div>
  </div>
);

export function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allMonthsWithTasks, setAllMonthsWithTasks] = useState<Date[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // 找到所有包含任务的月份
  useEffect(() => {
    if (!tasks.length) {
      setAllMonthsWithTasks([new Date()]);
      return;
    }

    const monthsMap = new Map<string, Date>();

    tasks.forEach(task => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        const monthKey = format(taskDate, "yyyy-MM");

        if (!monthsMap.has(monthKey)) {
          // 创建一个当月1号的日期对象
          const monthDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), 1);
          monthsMap.set(monthKey, monthDate);
        }
      }
    });

    // 按日期排序月份
    const sortedMonths = Array.from(monthsMap.values()).sort(
      (a, b) => a.getTime() - b.getTime()
    );

    if (sortedMonths.length === 0) {
      sortedMonths.push(new Date());
    }

    setAllMonthsWithTasks(sortedMonths);

    // 找到当前显示月份在排序后数组中的索引
    const currentMonthStr = format(currentDate, "yyyy-MM");
    const currentMonthIndex = sortedMonths.findIndex(
      date => format(date, "yyyy-MM") === currentMonthStr
    );

    // 如果当前月不在列表中，选择最近的月份
    if (currentMonthIndex >= 0) {
      setCurrentMonthIndex(currentMonthIndex);
      setCurrentDate(sortedMonths[currentMonthIndex]);
    } else {
      setCurrentMonthIndex(0);
      setCurrentDate(sortedMonths[0]);
    }
  }, [tasks]);

  // 修改tasksByDate的实现，确保所有任务都被添加
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const date = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      // 检查是否已存在相同的任务，避免重复
      const taskExists = acc[date].some(existingTask => existingTask.id === task.id);
      if (!taskExists) {
        acc[date].push(task);
      }
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }),
    end: endOfWeek(lastDayOfMonth, { weekStartsOn: 0 }),
  });

  const nextMonth = () => {
    if (currentMonthIndex < allMonthsWithTasks.length - 1) {
      const nextIndex = currentMonthIndex + 1;
      setCurrentMonthIndex(nextIndex);
      setCurrentDate(allMonthsWithTasks[nextIndex]);
    }
  };

  const prevMonth = () => {
    if (currentMonthIndex > 0) {
      const prevIndex = currentMonthIndex - 1;
      setCurrentMonthIndex(prevIndex);
      setCurrentDate(allMonthsWithTasks[prevIndex]);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy")}
          {allMonthsWithTasks.length > 1 && (
            <span className="text-sm text-gray-500 ml-2">
              ({currentMonthIndex + 1}/{allMonthsWithTasks.length} 个月)
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            disabled={currentMonthIndex <= 0}
            aria-label="Previous month with tasks"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            disabled={currentMonthIndex >= allMonthsWithTasks.length - 1}
            aria-label="Next month with tasks"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-t border-l">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-medium text-sm py-2 border-b border-r bg-gray-50 text-gray-500">
            {day}
          </div>
        ))}
        {daysInMonth.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] || [];
          return (
            <div
              key={day.toString()}
              className={`h-36 p-2 border-b border-r relative flex flex-col ${isSameMonth(day, currentDate) ? "" : "bg-gray-50/80 text-gray-400"}`}
            >
              <div className="flex justify-between items-center">
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={`text-sm font-semibold ${isToday(day) ? "bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center" : ""}`}
                >
                  {format(day, "d")}
                </time>
                {dayTasks.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
                    {dayTasks.length}
                  </span>
                )}
              </div>
              <div className="mt-1 overflow-y-auto flex-grow">
                {dayTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 