"use client";

import Link from "next/link";
import {
  Home,
  CheckSquare,
  Settings,
  Users,
  Plus,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface Workspace {
  id: string;
  name: string;
  iconUrl: string | null;
}

export default function Sidebar() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  // Get the current active workspace ID from the URL
  const activeWorkspaceId = pathname.includes('/workspaces/')
    ? pathname.split('/workspaces/')[1]?.split('/')[0]
    : null;

  return (
    <aside className="w-72 h-full bg-gray-50 border-r flex flex-col p-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          <span className="inline-block font-bold text-xl">Logoipsum</span>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Workspaces
        </h2>
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" aria-label="Create workspace">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-1 mb-6">
        {isLoading ? (
          <div className="text-sm text-gray-500 p-2">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="text-sm text-gray-500 p-2">No workspaces found</div>
        ) : (
          workspaces.map((ws) => {
            const isActive = activeWorkspaceId === ws.id;
            return (
              <div key={ws.id} className="relative group">
                <Button
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Link
                    href={`/dashboard/workspaces/${ws.id}`}
                    className="flex items-center space-x-3"
                  >
                    {ws.iconUrl ? (
                      <Image
                        src={ws.iconUrl}
                        alt={ws.name}
                        width={24}
                        height={24}
                        className="rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center">
                        <span className="font-semibold text-gray-500 text-xs">
                          {ws.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-sm truncate flex-1">
                      {ws.name}
                    </span>
                    {isActive ? (
                      <Link
                        href={`/dashboard/workspaces/${ws.id}/settings`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </Link>
                    ) : (
                      <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                    )}
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </div>

      <nav className="flex flex-col space-y-1">
        <Button asChild variant={pathname === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </Button>
        <Button asChild variant={pathname === "/dashboard/my-tasks" ? "secondary" : "ghost"} className="w-full justify-start">
          <Link href="/dashboard/my-tasks" className="flex items-center space-x-3">
            <CheckSquare className="h-4 w-4" />
            <span>My Tasks</span>
          </Link>
        </Button>
        {activeWorkspaceId && (
          <Button
            asChild
            variant={pathname.includes(`/workspaces/${activeWorkspaceId}/settings`) ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link
              href={`/dashboard/workspaces/${activeWorkspaceId}/settings`}
              className="flex items-center space-x-3"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </Button>
        )}
        <Button asChild variant={pathname === "/dashboard/members" ? "secondary" : "ghost"} className="w-full justify-start">
          <Link href="/dashboard/members" className="flex items-center space-x-3">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </Link>
        </Button>
      </nav>
    </aside>
  );
} 