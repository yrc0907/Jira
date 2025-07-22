import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { workspaceId } = params;
  const userId = session.user.id;

  try {
    const assignedTasks = await db.task.findMany({
      where: {
        project: {
          workspaceId: workspaceId,
        },
        assignees: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        changeRequests: {
          where: {
            status: 'PENDING'
          }
        }
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // If a task has a pending change request, reflect its status as "In Review"
    const tasksWithPendingStatus = assignedTasks.map(task => {
      if (task.changeRequests.length > 0) {
        return { ...task, status: 'In Review' };
      }
      return task;
    });

    return NextResponse.json(tasksWithPendingStatus);
  } catch (error) {
    console.error("Failed to fetch assigned tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned tasks" },
      { status: 500 }
    );
  }
} 