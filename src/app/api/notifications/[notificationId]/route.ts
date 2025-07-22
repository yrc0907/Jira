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
        data: { status: changeRequestStatus },
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
            message: `Your change request for task "${notification.changeRequest.task.name}" has been approved.`,
            link: `/dashboard/workspaces/${notification.changeRequest.task.project.workspaceId}/tasks`,
          }
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
            message: `Your change request for task "${notification.changeRequest.task.name}" has been rejected.`,
            link: `/dashboard/workspaces/${notification.changeRequest.task.project.workspaceId}/tasks`,
          }
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