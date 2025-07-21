import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, memberId } = params;
    const { projectId, canView, canEdit } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const isOwner = workspace.userId === session.user.id;
    const currentUserMembership = workspace.members.find(m => m.userId === session.user.id);

    if (!isOwner && !(currentUserMembership && currentUserMembership.role === 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memberToUpdate = workspace.members.find(m => m.userId === memberId);
    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Owners can edit admins' permissions, but admins cannot edit other admins' or owners' permissions.
    if (!isOwner && (memberToUpdate.role === 'admin' || workspace.userId === memberToUpdate.userId)) {
      return NextResponse.json({ error: 'Admins cannot edit permissions of other admins or the owner.' }, { status: 403 })
    }

    const existingPermission = await prisma.projectPermission.findFirst({
      where: {
        workspaceMemberId: memberToUpdate.id,
        projectId: projectId,
      },
    });

    if (existingPermission) {
      await prisma.projectPermission.update({
        where: { id: existingPermission.id },
        data: { canView, canEdit },
      });
    } else {
      await prisma.projectPermission.create({
        data: {
          workspaceMemberId: memberToUpdate.id,
          projectId: projectId,
          canView,
          canEdit,
        },
      });
    }

    return NextResponse.json({ message: 'Permissions updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 