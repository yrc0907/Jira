import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { workspaceId: string; userId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, userId } = params;

    // Check if the current user is the owner of the workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or you are not the owner' }, { status: 403 });
    }

    // Prevent owner from removing themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Owner cannot be removed from the workspace." }, { status: 400 });
    }

    // Remove the user from the workspace
    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 