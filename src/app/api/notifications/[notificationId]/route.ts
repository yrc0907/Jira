import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { notificationId } = params;
  const { isRead, changeRequestStatus } = await req.json();

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      include: {
        changeRequest: {
          include: {
            task: {
              include: {
                project: true
              }
            }
          }
        }
      },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (isRead !== undefined) {
      await db.notification.update({
        where: { id: notificationId },
        data: { isRead },
      });
    }

    if (changeRequestStatus && notification.changeRequest) {
      await db.taskChangeRequest.update({
        where: { id: notification.changeRequest.id },
        data: {
          status: changeRequestStatus,
          processorId: session.user.id,
        },
      });

      const processor = await db.user.findUnique({ where: { id: session.user.id } });
      const processorName = processor?.name || processor?.username || 'An administrator';

      const updateMessage = `Request for task "${notification.changeRequest.task.name}" was ${changeRequestStatus.toLowerCase()} by ${processorName}.`;

      // Update all notifications for this change request
      await db.notification.updateMany({
        where: {
          changeRequestId: notification.changeRequest.id,
          NOT: {
            userId: notification.changeRequest.requesterId
          }
        },
        data: {
          message: updateMessage
        }
      });


      if (changeRequestStatus === 'APPROVED') {
        await db.task.update({
          where: { id: notification.changeRequest.taskId },
          data: {
            status: notification.changeRequest.newStatus || undefined,
            dueDate: notification.changeRequest.newDueDate || undefined,
          },
        });
        // Notify requester
        await db.notification.create({
          data: {
            userId: notification.changeRequest.requesterId,
            message: `Your change request for task "${notification.changeRequest.task.name}" has been approved by ${processorName}.`,
            link: `/dashboard/workspaces/${notification.changeRequest.task.project.workspaceId}/tasks`,
            workspaceId: notification.changeRequest.task.project.workspaceId,
            projectId: notification.changeRequest.task.projectId,
            taskId: notification.changeRequest.taskId,
            actorId: session.user.id,
          },
        });
      } else if (changeRequestStatus === 'REJECTED') {
        await db.task.update({
          where: { id: notification.changeRequest.taskId },
          data: {
            status: notification.changeRequest.originalStatus,
          },
        });
        // Notify requester
        await db.notification.create({
          data: {
            userId: notification.changeRequest.requesterId,
            message: `Your change request for task "${notification.changeRequest.task.name}" has been rejected by ${processorName}.`,
            link: `/dashboard/workspaces/${notification.changeRequest.task.project.workspaceId}/tasks`,
            workspaceId: notification.changeRequest.task.project.workspaceId,
            projectId: notification.changeRequest.task.projectId,
            taskId: notification.changeRequest.taskId,
            actorId: session.user.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { notificationId } = params;

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
} 