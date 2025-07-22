import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        workspace: true,
        project: true,
        task: true,
        actor: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        changeRequest: {
          include: {
            task: {
              include: {
                project: {
                  include: {
                    workspace: true,
                  },
                },
              },
            },
            requester: {
              select: {
                id: true,
                name: true,
                username: true,
              }
            },
            processor: {
              select: {
                id: true,
                name: true,
                username: true,
              }
            }
          }
        }
      }
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
} 