"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function JoinWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState("正在处理您的邀请...");

  const { workspaceId, inviteCode } = params;

  useEffect(() => {
    if (status === 'loading') {
      setMessage("正在验证您的身份...");
      return;
    }

    if (status === 'unauthenticated') {
      toast.info("请先登录或注册以加入工作区。");
      router.push(`/login?callbackUrl=${window.location.href}`);
      return;
    }

    if (status === 'authenticated') {
      handleJoinWorkspace();
    }
  }, [status, router, workspaceId, inviteCode]);

  const handleJoinWorkspace = async () => {
    if (isJoining) return;

    setIsJoining(true);
    setMessage("正在将您添加到工作区...");

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/join/${inviteCode}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success("成功加入工作区！正在跳转...");
        router.push(`/dashboard/workspaces/${workspaceId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '加入工作区失败');
      }
    } catch (error: any) {
      toast.error(error.message);
      setMessage(`出现错误: ${error.message}. 您将被重定向到仪表盘。`);
      setTimeout(() => router.push('/dashboard'), 3000);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
        <h1 className="text-2xl font-bold mb-4">加入工作区邀请</h1>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-gray-600">{message}</p>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          如果页面长时间未跳转，请尝试刷新。
        </p>
      </div>
    </div>
  );
} 