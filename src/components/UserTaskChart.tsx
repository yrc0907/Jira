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
import { Input } from "@/components/ui/input";

interface Task {
  id: string;
  status: string;
  updatedAt: string;
  assignees: { id: string, name?: string | null, username: string }[];
}

interface User {
  id: string;
  name?: string | null;
  username: string;
}

interface UserTaskChartProps {
  tasks: Task[];
  users: User[];
}

const userColors: { [key: string]: string } = {};
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const UserTaskChart = ({ tasks, users }: UserTaskChartProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    return users.filter(user =>
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const chartData = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'Done');
    if (completedTasks.length === 0) return [];

    const tasksByDate: { [date: string]: Task[] } = {};
    completedTasks.forEach(task => {
      const dateStr = new Date(task.updatedAt).toISOString().split('T')[0];
      if (!tasksByDate[dateStr]) {
        tasksByDate[dateStr] = [];
      }
      tasksByDate[dateStr].push(task);
    });

    const sortedDates = Object.keys(tasksByDate).sort();

    const cumulativeData: { [userId: string]: number } = {};
    const usersToTrack = selectedUserId ? users.filter(u => u.id === selectedUserId) : users;

    usersToTrack.forEach(user => {
      cumulativeData[user.id] = 0;
    });

    const finalData = sortedDates.map(dateStr => {
      const point: { [key: string]: any } = {
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      const tasksOfTheDay = tasksByDate[dateStr];
      tasksOfTheDay.forEach(task => {
        task.assignees.forEach(assignee => {
          if (cumulativeData[assignee.id] !== undefined) {
            cumulativeData[assignee.id]++;
          }
        });
      });

      usersToTrack.forEach(user => {
        point[user.name || user.username] = cumulativeData[user.id];
      });

      return point;
    });

    return finalData;
  }, [tasks, users, selectedUserId]);

  useMemo(() => {
    users.forEach(user => {
      if (!userColors[user.id]) {
        userColors[user.id] = getRandomColor();
      }
    });
  }, [users]);

  if (tasks.length === 0 || users.length === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Task Completion</CardTitle>
          <CardDescription>
            Line chart showing task completion for each user over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No completed tasks to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Task Completion</CardTitle>
          <CardDescription>
            Line chart showing task completion for each user over time.
          </CardDescription>
        </div>
        <Select
          value={selectedUserId || "all"}
          onValueChange={(value) => setSelectedUserId(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <Input
                placeholder="Search user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <SelectItem value="all">All Users</SelectItem>
            {filteredUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {(selectedUserId ? users.filter(u => u.id === selectedUserId) : users).map(user => (
              <Line
                key={user.id}
                type="monotone"
                dataKey={user.name || user.username}
                stroke={userColors[user.id]}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}; 