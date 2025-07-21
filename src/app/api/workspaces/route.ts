import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const ownedWorkspaces = await db.workspace.findMany({
      where: {
        userId: userId,
      },
    });

    const memberWorkspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
        // Exclude workspaces they own
        NOT: {
          userId: userId,
        },
      },
    });

    return NextResponse.json({
      owned: ownedWorkspaces,
      member: memberWorkspaces,
    });
  } catch (error) {
    console.error("Failed to fetch workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
} 