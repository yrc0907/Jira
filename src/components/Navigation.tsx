"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function Navigation() {
  const pathname = usePathname();
  // Call useSession at the top level always
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  // Only render the full navigation after client-side hydration
  if (!mounted) {
    return (
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex gap-6 md:gap-10">
            <span className="flex items-center space-x-2">
              <span className="inline-block font-bold text-xl">Auth Demo</span>
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <div className="w-20 h-10 bg-gray-100 rounded animate-pulse"></div>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl">Auth Demo</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/">
            <Button variant={isActive("/") ? "default" : "ghost"}>Home</Button>
          </Link>
          {status === "authenticated" ? (
            <>
              <Link href="/dashboard">
                <Button variant={isActive("/dashboard") ? "default" : "ghost"}>Dashboard</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant={isActive("/login") ? "default" : "ghost"}>Login</Button>
              </Link>
              <Link href="/register">
                <Button variant={isActive("/register") ? "default" : "ghost"}>Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 