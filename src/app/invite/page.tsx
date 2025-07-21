"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState("正在处理您的邀请...");
  const [error, setError] = useState<string | null>(null);
  const [workspaceInfo, setWorkspaceInfo] = useState<{ id: string, name: string } | null>(null);

  const code = searchParams.get('code');

  // 首先验证邀请码并获取工作区信息
  useEffect(() => {
    if (!code) {
      setError("未提供邀请码");
      return;
    }

    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/invite/validate?code=${code}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "无效的邀请链接");
          return;
        }

        const data = await response.json();
        setWorkspaceInfo(data.workspace);

        // 如果用户已登录，自动尝试加入
        if (status === 'authenticated') {
          handleJoinWorkspace();
        }
      } catch (error) {
        console.error("验证邀请码时出错:", error);
        setError("验证邀请码时出错");
      }
    };

    validateInvite();
  }, [code, status]);

  const handleJoinWorkspace = async () => {
    if (isJoining || !code) return;

    setIsJoining(true);
    setMessage("正在将您添加到工作区...");

    try {
      const response = await fetch('/api/invite/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("成功加入工作区！正在跳转...");
        router.push(`/dashboard/workspaces/${data.workspaceId}`);
      } else {
        throw new Error(data.error || "加入工作区失败");
      }
    } catch (error: any) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  // 显示加载状态
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-4">验证您的身份...</h1>
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // 显示错误信息
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-4">邀请错误</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>
            返回仪表板
          </Button>
        </div>
      </div>
    );
  }

  // 用户未登录，显示登录选项
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-4">加入工作区</h1>
          {workspaceInfo && (
            <p className="mb-6">您已被邀请加入 <strong>{workspaceInfo.name}</strong></p>
          )}
          <p className="mb-6">请登录或注册以继续</p>
          <div className="flex flex-col space-y-4">
            <Link href={`/login?callbackUrl=${encodeURIComponent(window.location.href)}`}>
              <Button className="w-full">登录</Button>
            </Link>
            <Link href={`/register?callbackUrl=${encodeURIComponent(window.location.href)}`}>
              <Button variant="outline" className="w-full">注册新账户</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 用户已登录，显示加入状态
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
        <h1 className="text-2xl font-bold mb-4">加入工作区</h1>
        {workspaceInfo && (
          <p className="mb-4">您正在加入 <strong>{workspaceInfo.name}</strong></p>
        )}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-gray-600">{message}</p>
        </div>
        {!isJoining && (
          <Button onClick={handleJoinWorkspace} className="w-full">
            加入工作区
          </Button>
        )}
      </div>
    </div>
  );
} 