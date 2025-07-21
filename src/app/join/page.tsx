"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState("Processing your invitation...");

  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (!inviteCode) {
      setMessage("No invite code provided. Redirecting to dashboard...");
      setTimeout(() => router.push('/dashboard'), 3000);
      return;
    }

    if (status === 'loading') {
      setMessage("Verifying your identity...");
      return;
    }

    if (status === 'unauthenticated') {
      toast.info("Please log in or sign up to join the workspace.");
      router.push(`/login?callbackUrl=${window.location.href}`);
      return;
    }

    if (status === 'authenticated') {
      handleJoinWorkspace();
    }
  }, [status, router, inviteCode]);

  const handleJoinWorkspace = async () => {
    if (isJoining || !inviteCode) return;

    setIsJoining(true);
    setMessage("Adding you to the workspace...");

    try {
      const response = await fetch(`/api/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Successfully joined the workspace! Redirecting...");
        router.push(`/dashboard/workspaces/${data.workspaceId}`);
      } else {
        throw new Error(data.error || 'Failed to join workspace');
      }
    } catch (error: any) {
      toast.error(error.message);
      setMessage(`Error: ${error.message}. You will be redirected to the dashboard.`);
      setTimeout(() => router.push('/dashboard'), 3000);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Joining Workspace</h1>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-gray-600">{message}</p>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          If you are not redirected, please refresh the page.
        </p>
      </div>
    </div>
  );
}

export default function JoinWorkspacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinContent />
    </Suspense>
  );
} 