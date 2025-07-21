import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";

// GET a specific workspace
export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  console.log("GET workspace API called with ID:", params.workspaceId);

  const session = await auth();
  console.log("Session user ID:", session?.user?.id);

  if (!session?.user?.id) {
    console.log("No authenticated user found");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const workspace = await db.workspace.findFirst({
      where: {
        id: params.workspaceId,
        OR: [
          {
            userId: session.user.id,
          },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        projects: {
          include: {
            tasks: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or you are not a member" },
        { status: 404 }
      );
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Failed to fetch workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}

// PATCH to update a workspace
export async function PATCH(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const icon = formData.get("icon") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    // Check if workspace exists and belongs to user
    const existingWorkspace = await db.workspace.findUnique({
      where: {
        id: params.workspaceId,
        userId: session.user.id,
      },
    });

    if (!existingWorkspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Process icon if provided
    let iconUrl = existingWorkspace.iconUrl;
    if (icon && icon.size > 0) {
      const bytes = await icon.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const iconPath = join("public", "uploads", icon.name);
      await writeFile(iconPath, buffer);
      iconUrl = `/uploads/${icon.name}`;
    }

    // Update workspace
    const updatedWorkspace = await db.workspace.update({
      where: {
        id: params.workspaceId,
      },
      data: {
        name,
        iconUrl,
      },
    });

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error("Failed to update workspace:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}

// DELETE a workspace
export async function DELETE(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Check if workspace exists and belongs to user
    const existingWorkspace = await db.workspace.findUnique({
      where: {
        id: params.workspaceId,
        userId: session.user.id,
      },
    });

    if (!existingWorkspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Delete workspace
    await db.workspace.delete({
      where: {
        id: params.workspaceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
} 