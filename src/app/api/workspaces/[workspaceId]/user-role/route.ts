import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { workspaceId } = params;
  const userId = session.user.id;

  try {
    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: userId,
      }
    });

    if (workspace) {
      return NextResponse.json({ role: 'owner' });
    }

    if (member) {
      return NextResponse.json({ role: member.role });
    }

    return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });

  } catch (error) {
    console.error("Failed to get user role:", error);
    return NextResponse.json(
      { error: "Failed to get user role" },
      { status: 500 }
    );
  }
} 