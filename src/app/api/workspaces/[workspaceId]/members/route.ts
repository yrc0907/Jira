import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// I'm assuming Role is defined in your prisma schema like this:
// enum Role {
//  ADMIN
//  MEMBER
// }
// And that WorkspaceMember model has a 'role' field of type 'Role'.
// Also assuming Workspace has a 'userId' field for the owner.

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { user: { select: { id: true, name: true, username: true } } }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const membersInDb = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, username: true } } }
    });

    // Check if requester is owner or a member
    const isOwner = workspace.userId === session.user.id;
    const isMember = membersInDb.some(m => m.userId === session.user.id);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ownerInfo = {
      id: workspace.user.id,
      userId: workspace.user.id,
      name: workspace.user.name,
      username: workspace.user.username,
      role: 'OWNER'
    };

    const memberInfo = membersInDb.map(m => ({
      id: m.user.id,
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      role: m.role.toUpperCase(),
      memberId: m.id,
    }));

    const allMembers = [ownerInfo, ...memberInfo.filter(m => m.userId !== ownerInfo.userId)];

    const currentUser = allMembers.find(m => m.id === session.user.id);

    return NextResponse.json({ members: allMembers, currentUser });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 