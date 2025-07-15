"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: React.ReactNode;
};

export function NextAuthProvider({ children }: Props) {
  return (
    <SessionProvider refetchInterval={0}>
      {children}
      <Toaster />
    </SessionProvider>
  );
} 