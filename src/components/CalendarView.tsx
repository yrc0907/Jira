"use client";

import { useState } from "react";
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

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }), // Sunday as start of week
    end: endOfWeek(lastDayOfMonth, { weekStartsOn: 0 }),
  });

  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      const date = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
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
          return (
            <div
              key={day.toString()}
              className={`h-36 p-2 border-b border-r relative flex flex-col ${isSameMonth(day, currentDate) ? "" : "bg-gray-50/80 text-gray-400"
                }`}
            >
              <time
                dateTime={format(day, "yyyy-MM-dd")}
                className={`text-sm font-semibold self-start ${isToday(day) ? "bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center" : ""
                  }`}
              >
                {format(day, "d")}
              </time>
              <div className="mt-1 overflow-y-auto flex-grow">
                {tasksByDate[dateKey]?.map(task => (
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