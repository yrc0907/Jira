"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOut } from "@/components/auth/signout-button";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const userInitial =
    user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "A";
  const pathname = usePathname();

  // Determine the current page title based on the pathname
  let pageTitle = "Home";
  let pageDescription = "Monitor all of your projects and tasks here";

  if (pathname.includes("/settings")) {
    pageTitle = "Settings";
    pageDescription = "Manage your workspace settings";
  } else if (pathname.includes("/my-tasks")) {
    pageTitle = "My Tasks";
    pageDescription = "View and manage your assigned tasks";
  } else if (pathname.includes("/members")) {
    pageTitle = "Members";
    pageDescription = "Manage workspace members";
  } else if (pathname.includes("/workspaces/")) {
    if (pathname.endsWith("/dashboard")) {
      pageTitle = "Workspace";
      pageDescription = "View your workspace details";
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <div>
            <h1 className="text-xl font-semibold">{pageTitle}</h1>
            <p className="text-sm text-gray-500">
              {pageDescription}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={user?.image || undefined} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <SignOut />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
} 