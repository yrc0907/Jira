import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

// PATCH - Update a task
export async function PATCH(
  request: Request,
  { params }: { params: { workspaceId: string; projectId: string; taskId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, projectId, taskId } = params;
    const body = await request.json();

    // Validate that we have some data to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No update data provided." }, { status: 400 });
    }

    // If name is provided, ensure it's not empty
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    // Verify user has access to the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    });
    const workspaceOwner = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id
      }
    })
    if (!workspaceMember && !workspaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if the task belongs to the specified project
    if (existingTask.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 });
    }

    // Check if the project belongs to the specified workspace
    if (existingTask.project.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Project does not belong to this workspace' }, { status: 403 });
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        assigneeId: body.assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { workspaceId: string; projectId: string; taskId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, projectId, taskId } = params;

    // Verify user has access to the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: workspaceId,
      },
    });
    const workspaceOwner = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id
      }
    })
    if (!workspaceMember && !workspaceOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if the task belongs to the specified project
    if (existingTask.projectId !== projectId) {
      return NextResponse.json({ error: 'Task does not belong to this project' }, { status: 403 });
    }

    // Check if the project belongs to the specified workspace
    if (existingTask.project.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Project does not belong to this workspace' }, { status: 403 });
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 