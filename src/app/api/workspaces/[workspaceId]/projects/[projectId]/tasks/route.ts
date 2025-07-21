import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/workspaces/:workspaceId/projects/:projectId/tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; projectId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { workspaceId, projectId } = await params;

    // 验证用户是工作区的成员或所有者
    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    const workspaceOwner = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
    });

    if (!member && !workspaceOwner) {
      return NextResponse.json(
        { error: "您没有访问此工作区的权限" },
        { status: 403 }
      );
    }

    // Verify the project exists and belongs to this workspace
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get tasks for this project
    const tasks = await db.task.findMany({
      where: {
        projectId,
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/:workspaceId/projects/:projectId/tasks
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; projectId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { workspaceId, projectId } = params;

    // 验证用户是工作区的成员或所有者
    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    const workspaceOwner = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
    });

    if (!member && !workspaceOwner) {
      return NextResponse.json(
        { error: "您没有访问此工作区的权限" },
        { status: 403 }
      );
    }

    // Verify the project exists and belongs to this workspace
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate request body
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }

    // Create the task
    const task = await db.task.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status || "Backlog",
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        projectId,
        assigneeId: body.assigneeId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
} 