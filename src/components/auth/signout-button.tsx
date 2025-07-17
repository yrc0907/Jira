"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOut() {
  return (
    <form
      action={async () => {
        await signOut({ redirectTo: "/" });
      }}
      className="w-full"
    >
      <button type="submit" className="flex w-full items-center">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Logout</span>
      </button>
    </form>
  );
} 