import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/workspaces/:workspaceId/projects/:projectId
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

    // First verify the workspace exists and belongs to the user
    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        userId: session.user.id
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Then get the project that belongs to this workspace
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

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/:workspaceId/projects/:projectId
export async function PUT(
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

    // First verify the workspace exists and belongs to the user
    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        userId: session.user.id
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Then verify the project exists and belongs to this workspace
    const existingProject = await db.project.findUnique({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!existingProject) {
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
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Update the project
    const updatedProject = await db.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/:workspaceId/projects/:projectId
export async function DELETE(
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

    // First verify the workspace exists and belongs to the user
    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        userId: session.user.id
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Then verify the project exists and belongs to this workspace
    const existingProject = await db.project.findUnique({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete the project
    await db.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
} 