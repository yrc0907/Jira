import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Create a new Prisma Client instance
const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();

    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.workspaceId;

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { user: true }
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get the workspace owner
    const workspaceOwner = {
      id: workspace.user.id,
      name: workspace.user.name,
      username: workspace.user.username,
      role: "owner"
    };

    // Get workspace members through the WorkspaceMember table
    const workspaceMembers = await prisma.user.findMany({
      where: {
        workspaceMemberships: {
          some: {
            workspaceId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        workspaceMemberships: {
          where: {
            workspaceId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // Transform the members data to match the expected format
    const members = workspaceMembers.map((member) => ({
      id: member.id,
      name: member.name,
      username: member.username,
      role: member.workspaceMemberships[0]?.role || "member",
    }));

    // Combine the owner and members, but avoid duplicates
    let users = [workspaceOwner];

    // Add members that aren't the owner
    members.forEach(member => {
      if (member.id !== workspaceOwner.id) {
        users.push(member);
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 