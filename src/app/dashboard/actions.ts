"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createWorkspace(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Not authenticated",
    };
  }

  const name = formData.get("name") as string;
  const icon = formData.get("icon") as File;

  if (!name) {
    return {
      error: "Workspace name is required.",
    };
  }

  let iconUrl: string | undefined = undefined;
  if (icon && icon.size > 0) {
    const bytes = await icon.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const iconPath = join("public", "uploads", icon.name);
    await writeFile(iconPath, buffer);
    iconUrl = `/uploads/${icon.name}`;
  }

  try {
    const workspace = await db.workspace.create({
      data: {
        name,
        iconUrl,
        userId: session.user.id,
      },
    });
    revalidatePath("/dashboard");
    redirect(`/dashboard/workspaces/${workspace.id}`);
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Failed to create workspace:", error);
    return {
      error: "Failed to create workspace.",
    };
  }
} 