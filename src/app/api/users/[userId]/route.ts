import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: {
        id: params.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        workspaces: {
          select: {
            id: true,
            name: true,
            iconUrl: true,
          },
        },
        workspaceMemberships: {
          select: {
            workspace: {
              select: {
                id: true,
                name: true,
                iconUrl: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true,
                workspace: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { workspaces, workspaceMemberships, ...rest } = user;
    const allWorkspaces = [
      ...workspaces,
      ...workspaceMemberships.map((m) => m.workspace),
    ];
    const uniqueWorkspaces = Array.from(
      new Map(allWorkspaces.map((ws) => [ws.id, ws])).values()
    );

    return NextResponse.json({ ...rest, workspaces: uniqueWorkspaces });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
} 