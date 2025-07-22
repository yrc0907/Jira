"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Briefcase, Calendar, Mail, User } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  image: string | null;
  createdAt: string;
  workspaces: {
    id: string;
    name: string;
    iconUrl: string | null;
  }[];
  tasks: {
    id: string;
    name: string;
    status: string;
    project: {
      id: string;
      name: string;
      workspace: {
        id: string;
        name: string;
      };
    };
  }[];
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          } else {
            console.error("Failed to fetch user");
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId]);

  if (isLoading) {
    return <div className="p-8">Loading user profile...</div>;
  }

  if (!user) {
    return <div className="p-8">User not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() ||
                    user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Joined on {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.workspaces.map((ws) => (
                  <Link
                    href={`/dashboard/workspaces/${ws.id}`}
                    key={ws.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    {ws.iconUrl ? (
                      <img
                        src={ws.iconUrl}
                        alt={ws.name}
                        className="h-8 w-8 rounded-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-sm bg-muted flex items-center justify-center font-semibold">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{ws.name}</span>
                  </Link>
                ))}
              </div>
              {user.workspaces.length === 0 && (
                <p className="text-muted-foreground">
                  Not a member of any workspaces.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assigned Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.tasks.map((task) => (
                  <Link
                    href={`/dashboard/workspaces/${task.project.workspace.id}/tasks?taskId=${task.id}`}
                    key={task.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors block"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{task.name}</p>
                        <p className="text-sm text-muted-foreground">
                          in{" "}
                          <span className="font-medium">
                            {task.project.name}
                          </span>
                        </p>
                      </div>
                      <Badge>{task.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
              {user.tasks.length === 0 && (
                <p className="text-muted-foreground">No tasks assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 