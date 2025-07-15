import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {session.user?.name || session.user?.username || 'User'}</CardTitle>
            <CardDescription>
              You are logged in with username: {session.user?.username || 'Unknown'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This is a protected page that can only be accessed by authenticated users.
            </p>
            <div className="flex space-x-4">
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
              <form action="/api/auth/signout" method="POST">
                <Button variant="destructive">Sign Out</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 