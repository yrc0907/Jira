"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Settings,
  Users,
  Home,
  Briefcase,
  User,
  Bell,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Workspace {
  id: string;
  name: string;
  iconUrl: string | null;
}

interface UserWorkspaces {
  owned: Workspace[];
  member: Workspace[];
}

interface Notification {
  id: string;
  isRead: boolean;
}

interface NotificationCounts {
  workspaces: { [key: string]: number };
  projects: { [key: string]: { [key: string]: number } };
  total: number;
}

const Sidebar = () => {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<UserWorkspaces>({
    owned: [],
    member: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    workspaces: {},
    projects: {},
    total: 0,
  });
  const { data: session } = useSession();

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
    const fetchNotificationCounts = async () => {
      try {
        const response = await fetch("/api/notifications/counts");
        if (response.ok) {
          const data: NotificationCounts = await response.json();
          setNotificationCounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch notification counts:", error);
      }
    };
    fetchWorkspaces();
    fetchNotificationCounts();

    const interval = setInterval(fetchNotificationCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const workspaceId = pathname.split("/")[3];

  return (
    <div className="h-full w-64 fixed flex flex-col border-r bg-white">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-md"></div>
          <span className="font-semibold text-lg">Logoipsum</span>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase">
              Navigation
            </h2>
          </div>
          <Link
            href={`/dashboard/notifications`}
            className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${pathname === "/dashboard/notifications"
              ? "bg-gray-100 font-semibold"
              : ""
              }`}
          >
            <Bell className="h-4 w-4" />
            <span>All Notifications</span>
            {notificationCounts.total > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCounts.total}
              </span>
            )}
          </Link>
        </div>
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
                  className={`relative flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${workspaceId === ws.id ? "bg-gray-100 font-semibold" : ""
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
                  {notificationCounts.workspaces[ws.id] > 0 && (
                    <div className="absolute right-2 h-2 w-2 bg-red-500 rounded-full" />
                  )}
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
                  className={`relative flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${workspaceId === ws.id ? "bg-gray-100 font-semibold" : ""
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
                  {notificationCounts.workspaces[ws.id] > 0 && (
                    <div className="absolute right-2 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        {workspaceId && (
          <div className="border-t pt-4 mt-4">
            <Link
              href={`/dashboard/workspaces/${workspaceId}`}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${pathname.endsWith(`/workspaces/${workspaceId}`)
                ? "bg-gray-100 font-semibold"
                : ""
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
              href={`/dashboard/notifications`}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 ${pathname.includes(`/notifications`)
                  ? "bg-gray-100 font-semibold"
                  : ""
                }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {notificationCounts.workspaces[workspaceId] > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCounts.workspaces[workspaceId]}
                </span>
              )}
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
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2 w-full hover:bg-gray-100 p-2 rounded-md">
            <Avatar className="h-8 w-8">
              {session?.user?.image ? (
                <Image src={session.user.image} alt={session.user.name || ""} width={32} height={32} className="rounded-full" />
              ) : (
                <AvatarFallback>
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-left">
              <p className="font-semibold text-sm">{session?.user?.name || "User Name"}</p>
              <p className="text-xs text-gray-500">{session?.user?.email || "user@email.com"}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar; 