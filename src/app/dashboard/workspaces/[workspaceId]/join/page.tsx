"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function JoinWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    if (status === "authenticated") {
      const joinWorkspace = async () => {
        try {
          const response = await fetch(`/api/workspaces/${workspaceId}/join`, {
            method: "POST",
          });

          const data = await response.json();

          if (response.ok) {
            toast.success("成功加入工作区");
          } else {
            toast.error(data.error || "加入工作区失败");
          }
        } catch (error) {
          console.error("Error joining workspace:", error);
          toast.error("加入工作区时发生错误");
        } finally {
          router.push(`/dashboard/workspaces/${workspaceId}`);
        }
      };

      if (workspaceId) {
        joinWorkspace();
      }
    } else if (status === "unauthenticated") {
      // Redirect to login, but keep the invite link to redirect back after login
      router.push(`/login?callbackUrl=/dashboard/workspaces/${workspaceId}/join`);
    }
  }, [workspaceId, router, session, status]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-lg font-semibold">正在加入工作区...</p>
        <p className="text-gray-500 mt-2">
          请稍候，我们将把您添加到工作区并重定向。
        </p>
      </div>
    </div>
  );
} 