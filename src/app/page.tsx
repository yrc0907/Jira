import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Next.js Authentication Demo</h1>
        <p className="text-xl text-muted-foreground">
          A simple authentication example using Next.js, Auth.js and shadcn/ui
        </p>
      </div>

      <div className="grid gap-6 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>
              {session ? "You are currently logged in" : "You are not logged in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session ? (
              <div>
                <p className="mb-2">
                  Logged in as: <strong>{session.user?.name || session.user?.username || 'User'}</strong>
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  You can now access protected routes.
                </p>
              </div>
            ) : (
              <p className="mb-4">
                Log in to access protected routes and manage your account.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Register</Button>
                </Link>
              </>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Secure user authentication with Auth.js</li>
              <li>Username and password login</li>
              <li>Persistent sessions with JWT</li>
              <li>Protected routes with server-side authentication</li>
              <li>Modern UI with shadcn/ui components</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
