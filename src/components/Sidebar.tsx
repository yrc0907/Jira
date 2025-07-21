"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Plus,
  Settings,
  Users,
  Home,
  Briefcase,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Workspace {
  id: string;
  name: string;
  iconUrl: string | null;
}

interface UserWorkspaces {
  owned: Workspace[];
  member: Workspace[];
}

const Sidebar = () => {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<UserWorkspaces>({
    owned: [],
    member: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true);
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

  const workspaceId = pathname.split("/")[3];

  return (
    <div className="h-full w-64 fixed flex flex-col border-r bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-md"></div>
          <span className="font-semibold text-lg">Logoipsum</span>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase">
              My Workspaces
            </h2>
            <Link href="/dashboard/workspaces/new">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {workspaces.owned.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/dashboard/workspaces/${ws.id}`}
                  className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${workspaceId === ws.id ? "bg-gray-100 font-semibold" : ""
                    }`}
                >
                  {ws.iconUrl ? (
                    <Image
                      src={ws.iconUrl}
                      alt={ws.name}
                      width={24}
                      height={24}
                      className="rounded-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-sm flex items-center justify-center font-semibold text-gray-600">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{ws.name}</span>
                </Link>
              ))}
              {workspaces.owned.length === 0 && (
                <p className="text-sm text-gray-500">No workspaces found</p>
              )}
            </>
          )}
        </div>

        {workspaces.member.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2 mt-4">
              Joined Workspaces
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            ) : (
              workspaces.member.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/dashboard/workspaces/${ws.id}`}
                  className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${workspaceId === ws.id ? "bg-gray-100 font-semibold" : ""
                    }`}
                >
                  {ws.iconUrl ? (
                    <Image
                      src={ws.iconUrl}
                      alt={ws.name}
                      width={24}
                      height={24}
                      className="rounded-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-sm flex items-center justify-center font-semibold text-gray-600">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{ws.name}</span>
                </Link>
              ))
            )}
          </div>
        )}

        {workspaceId && (
          <div className="border-t pt-4 mt-4">
            <Link
              href={`/dashboard/workspaces/${workspaceId}`}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${pathname.endsWith(`/workspaces/${workspaceId}`) ? "bg-gray-100 font-semibold" : ""
                }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href={`/dashboard/workspaces/${workspaceId}/tasks`}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-gray-600 ${pathname.includes("/tasks") ? "bg-gray-100 font-semibold" : ""
                }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>My Tasks</span>
            </Link>
            <Link
              href={`/dashboard/workspaces/${workspaceId}/members`}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${pathname.includes("/members") ? "bg-gray-100 font-semibold" : ""
                }`}
            >
              <Users className="h-4 w-4" />
              <span>Members</span>
            </Link>
            <Link
              href={`/dashboard/workspaces/${workspaceId}/settings`}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${pathname.includes("/settings") ? "bg-gray-100 font-semibold" : ""
                }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </div>
        )}
      </div>
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-sm">User Name</p>
            <p className="text-xs text-gray-500">user@email.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 