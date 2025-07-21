"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUp, ArrowDown, CheckCircle, Clock, XCircle, AlertTriangle, ListTodo } from "lucide-react";
import { useMemo } from 'react';

// Define the Task interface based on what's used in the component
interface Task {
  id: string;
  status: string;
  dueDate?: string | null;
  assignees: { id: string }[];
}

interface ProjectStatsCardsProps {
  tasks: Task[];
  previousTaskCount?: number; // Optional prop for showing trend
}

export const ProjectStatsCards = ({ tasks, previousTaskCount }: ProjectStatsCardsProps) => {
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const assignedTasks = tasks.filter(t => t.assignees.length > 0).length;
    const incompleteTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(
      t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
    ).length;

    return {
      totalTasks,
      completedTasks,
      assignedTasks,
      incompleteTasks,
      overdueTasks,
    };
  }, [tasks]);

  const getTrend = (current: number, previous: number | undefined) => {
    if (previous === undefined || current === previous) return null;
    const diff = current - previous;
    return {
      diff: Math.abs(diff),
      direction: diff > 0 ? 'up' : 'down' as 'up' | 'down',
    };
  };

  const totalTrend = getTrend(stats.totalTasks, previousTaskCount);

  const StatCard = ({ title, value, icon, trend, description }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend?: { diff: number; direction: 'up' | 'down' } | null;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {trend && (
            <>
              {trend.direction === 'up' ?
                <ArrowUp className="h-4 w-4 text-green-500" /> :
                <ArrowDown className="h-4 w-4 text-red-500" />}
              <span className={`mr-1 ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend.diff}
              </span>
            </>
          )}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      <StatCard
        title="Total Tasks"
        value={stats.totalTasks}
        icon={<ListTodo className="h-4 w-4 text-muted-foreground" />}
        trend={totalTrend}
        description={totalTrend ? "since last week" : "up to date"}
      />
      <StatCard
        title="Assigned Tasks"
        value={stats.assignedTasks}
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        description={`${Math.round((stats.assignedTasks / stats.totalTasks) * 100) || 0}% assigned`}
      />
      <StatCard
        title="Incomplete Tasks"
        value={stats.incompleteTasks}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        description={`${stats.completedTasks} completed`}
      />
      <StatCard
        title="Completed Tasks"
        value={stats.completedTasks}
        icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
        description="Congrats on the progress!"
      />
      <StatCard
        title="Overdue Tasks"
        value={stats.overdueTasks}
        icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
        description="Needs immediate attention"
      />
    </div>
  );
}; 