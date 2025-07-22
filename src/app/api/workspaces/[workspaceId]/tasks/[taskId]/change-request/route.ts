import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string; taskId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { workspaceId, taskId } = params;
  const userId = session.user.id;

  try {
    const { newStatus, newDueDate, reason } = await req.json();

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create the change request
    const changeRequest = await db.taskChangeRequest.create({
      data: {
        taskId,
        requesterId: userId,
        originalStatus: task.status,
        newStatus,
        newDueDate: newDueDate ? new Date(newDueDate) : undefined,
        reason,
      },
    });

    // Notify admins and owner
    const members = await db.workspaceMember.findMany({
      where: {
        workspaceId,
        role: 'admin',
      },
    });
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });

    const adminUserIds = members.map(m => m.userId);
    const userIdsToNotify = [...new Set([...adminUserIds, workspace?.userId])]
      .filter(Boolean)
      .filter(id => id !== userId) as string[];

    if (userIdsToNotify.length > 0) {
      const message = `User ${session.user.name || session.user.username
        } requested a change for task "${task.name}" in project "${task.project.name
        }"`;
      await db.notification.createMany({
        data: userIdsToNotify.map((id) => ({
          userId: id,
          message: message,
          link: `/dashboard/workspaces/${workspaceId}/notifications`,
          changeRequestId: changeRequest.id,
          workspaceId: workspaceId,
          projectId: task.projectId,
          taskId: task.id,
          actorId: session.user.id,
        })),
      });
    }

    return NextResponse.json({ success: true, action: 'requested', changeRequest });

  } catch (error) {
    console.error("Failed to process task change request:", error);
    return NextResponse.json(
      { error: "Failed to process task change request" },
      { status: 500 }
    );
  }
} 