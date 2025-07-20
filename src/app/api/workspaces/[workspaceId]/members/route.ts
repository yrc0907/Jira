import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = params;
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if the current user is the owner of the workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or you are not the owner' }, { status: 404 });
    }

    // Find the user to add or create a new one for testing
    let userToAdd = await prisma.user.findUnique({ where: { username } });

    if (!userToAdd) {
      // For testing: if user doesn't exist, create one with a dummy password
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      userToAdd = await prisma.user.create({
        data: {
          username: username,
          name: username, // Use username as name for simplicity
          password: hashedPassword,
        },
      });
    }

    // Check if the user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
    }

    // Add the user to the workspace
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToAdd.id,
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    console.error('Error adding workspace member:', error);
    // Handle unique constraint violation for username gracefully during creation
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'This username was just taken. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 