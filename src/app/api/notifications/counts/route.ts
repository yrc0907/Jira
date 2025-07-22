import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const unreadCounts = await db.notification.groupBy({
      by: ['workspaceId', 'projectId'],
      where: {
        userId: session.user.id,
        isRead: false,
      },
      _count: {
        id: true,
      },
    });

    const result = {
      workspaces: {} as { [key: string]: number },
      projects: {} as { [key: string]: { [key: string]: number } },
      total: 0,
    };

    for (const group of unreadCounts) {
      const count = group._count.id;
      result.total += count;

      if (group.workspaceId) {
        if (!result.workspaces[group.workspaceId]) {
          result.workspaces[group.workspaceId] = 0;
        }
        result.workspaces[group.workspaceId] += count;

        if (group.projectId) {
          if (!result.projects[group.workspaceId]) {
            result.projects[group.workspaceId] = {};
          }
          if (!result.projects[group.workspaceId][group.projectId]) {
            result.projects[group.workspaceId][group.projectId] = 0;
          }
          result.projects[group.workspaceId][group.projectId] += count;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch notification counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification counts" },
      { status: 500 }
    );
  }
} 