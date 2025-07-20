"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setProjectName(data.name);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("加载项目详情失败");
      } finally {
        setIsLoading(false);
      }
    };

    if (workspaceId && projectId) {
      fetchProject();
    }
  }, [workspaceId, projectId, router]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error("项目名称不能为空");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新项目失败");
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      toast.success("项目已成功更新");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("更新项目失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("确定要删除此项目吗？此操作无法撤销。")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "删除项目失败");
      }

      toast.success("项目已成功删除");
      router.push(`/dashboard/workspaces/${workspaceId}`);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("删除项目失败");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">加载项目设置...</div>;
  }

  if (!project) {
    return <div className="p-8">未找到项目</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">项目设置</h1>
        <p className="text-muted-foreground">
          管理您的项目设置和配置
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>
            更新您的项目详情
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateProject}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="projectName" className="text-sm font-medium">
                项目名称
              </label>
              <Input
                id="projectName"
                placeholder="输入项目名称"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存更改
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">危险区域</CardTitle>
          <CardDescription>
            请注意，这些操作无法撤销
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            一旦删除项目，所有相关任务和数据将被永久删除。
          </p>
          <Button
            variant="destructive"
            onClick={handleDeleteProject}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            删除项目
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 