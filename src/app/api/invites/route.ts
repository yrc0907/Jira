import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Deactivate old invites
    await prisma.invite.deleteMany({
      where: { workspaceId },
    });

    const code = nanoid(12);
    const newInvite = await prisma.invite.create({
      data: {
        workspaceId,
        code,
      },
    });

    return NextResponse.json(newInvite, { status: 201 });
  } catch (error) {
    console.error('Error generating invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 