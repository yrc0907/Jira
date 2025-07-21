import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, memberId } = params;
    const { role, canViewProject, canEditProject } = await request.json();

    if (role && !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const currentUserIsOwner = workspace.userId === session.user.id;
    const currentUserMembership = workspace.members.find(m => m.userId === session.user.id);
    const currentUserRole = currentUserIsOwner ? 'OWNER' : currentUserMembership?.role.toUpperCase();

    if (!currentUserRole) {
      return NextResponse.json({ error: 'You are not a member of this workspace.' }, { status: 403 });
    }

    const memberToUpdate = await prisma.workspaceMember.findFirst({
      where: {
        userId: memberId,
        workspaceId: workspaceId
      }
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found in this workspace.' }, { status: 404 });
    }

    if (memberToUpdate.userId === session.user.id && role) {
      return NextResponse.json({ error: 'Owner role cannot be changed.' }, { status: 400 });
    }

    const updateData: { role?: string, canViewProject?: boolean, canEditProject?: boolean } = {};

    if (role) {
      if (currentUserRole !== 'OWNER') {
        return NextResponse.json({ error: 'Only the workspace owner can change roles.' }, { status: 403 });
      }
      updateData.role = role;
    }

    if (canViewProject !== undefined || canEditProject !== undefined) {
      if (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Only owners or admins can change project permissions.' }, { status: 403 });
      }
      if (memberToUpdate.role === 'admin' || memberToUpdate.userId === workspace.userId) {
        return NextResponse.json({ error: 'Cannot change project permissions for owners or admins.' }, { status: 403 });
      }
      if (canViewProject !== undefined) updateData.canViewProject = canViewProject;
      if (canEditProject !== undefined) updateData.canEditProject = canEditProject;
    }


    await prisma.workspaceMember.update({
      where: {
        id: memberToUpdate.id
      },
      data: updateData,
    });

    return NextResponse.json({ message: 'Member updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, memberId: userIdToRemove } = params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const currentUserMembership = workspace.members.find(m => m.userId === session.user.id);
    const isOwner = workspace.userId === session.user.id;
    const currentUserRole = isOwner ? 'OWNER' : currentUserMembership?.role.toUpperCase();

    if (!currentUserRole) {
      return NextResponse.json({ error: 'You are not a member of this workspace.' }, { status: 403 });
    }

    const memberToRemove = workspace.members.find(m => m.userId === userIdToRemove);
    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found in this workspace.' }, { status: 404 });
    }

    const memberToRemoveRole = memberToRemove.role.toUpperCase();

    const canRemove =
      (currentUserRole === 'OWNER' && userIdToRemove !== session.user.id) ||
      (currentUserRole === 'ADMIN' && memberToRemoveRole === 'MEMBER');

    if (!canRemove) {
      return NextResponse.json({ error: 'You do not have permission to remove this member.' }, { status: 403 });
    }

    await prisma.workspaceMember.delete({
      where: {
        id: memberToRemove.id,
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

