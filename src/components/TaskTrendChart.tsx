"use client"

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskTrendChartProps {
  tasks: Task[];
}

const statusOptions = {
  created: "Created Tasks",
  completed: "Completed Tasks",
  Backlog: "Backlog",
  Todo: "Todo",
  "In Progress": "In Progress",
  "In Review": "In Review",
};

export const TaskTrendChart = ({ tasks }: TaskTrendChartProps) => {
  const [trendType, setTrendType] = useState('created');

  const chartData = useMemo(() => {
    const data: { [key: string]: { date: string; count: number } } = {};

    tasks.forEach(task => {
      const date = new Date(
        trendType === 'completed' ? task.updatedAt : task.createdAt
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!data[date]) {
        data[date] = { date, count: 0 };
      }

      if (trendType === 'created') {
        data[date].count++;
      } else if (trendType === 'completed' && task.status === 'Done') {
        data[date].count++;
      } else if (task.status === trendType) {
        data[date].count++;
      }
    });

    return Object.values(data).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks, trendType]);

  const getLineColor = () => {
    switch (trendType) {
      case 'created': return '#8884d8';
      case 'completed': return '#82ca9d';
      case 'Backlog': return '#fb923c'; // Orange
      case 'Todo': return '#f87171'; // Red
      case 'In Progress': return '#facc15'; // Yellow
      case 'In Review': return '#60a5fa'; // Blue
      default: return '#9ca3af'; // Gray
    }
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Task Trends</CardTitle>
          <CardDescription>
            A line chart showing the trend of tasks over time.
          </CardDescription>
        </div>
        <Select value={trendType} onValueChange={setTrendType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select trend" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusOptions).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name={statusOptions[trendType as keyof typeof statusOptions]}
              stroke={getLineColor()}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}; 