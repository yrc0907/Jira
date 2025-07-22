"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  iconUrl: string | null;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationCounts {
  workspaces: { [key: string]: number };
  projects: { [key: string]: { [key: string]: number } };
  total: number;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    workspaces: {},
    projects: {},
    total: 0,
  });

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return router.push("/404");
          } else if (response.status === 401) {
            return router.push("/login");
          }
          throw new Error(`Failed to fetch workspace: ${response.status}`);
        }

        const data = await response.json();
        setWorkspace(data);
      } catch (error) {
        console.error("Error fetching workspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/projects`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    const fetchNotificationCounts = async () => {
      try {
        const response = await fetch('/api/notifications/counts');
        if (response.ok) {
          const data = await response.json();
          setNotificationCounts(data);
        }
      } catch (error) {
        console.error("Error fetching notification counts:", error);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
      fetchProjects();
      fetchNotificationCounts();
      const interval = setInterval(fetchNotificationCounts, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [workspaceId, router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProjectName }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects((prev) => [...prev, newProject]);
        setNewProjectName("");
        setShowCreateForm(false);
        toast.success(`Project "${newProjectName}" has been created successfully.`);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading workspace...</div>;
  }

  if (!workspace) {
    return <div className="p-8">Workspace not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <Link
          href={`/dashboard/workspaces/${workspace.id}/settings`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>



      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Projects</h2>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateProject} className="flex items-center gap-2 mb-4 p-4 border rounded-md bg-gray-50">
            <Input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </form>
        )}

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}`}
                key={project.id}
              >
                <Card className="hover:shadow-md transition-shadow relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">View</div>
                    <p className="text-xs text-muted-foreground">
                      Click to see project details
                    </p>
                  </CardContent>
                  {notificationCounts.projects[workspaceId]?.[project.id] > 0 && (
                    <div className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">No projects found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a new project to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 