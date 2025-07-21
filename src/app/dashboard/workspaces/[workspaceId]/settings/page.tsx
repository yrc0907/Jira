"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Workspace {
  id: string;
  name: string;
  iconUrl: string | null;
}

export default function WorkspaceSettings() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  console.log("Settings page loaded with workspaceId:", workspaceId);
  console.log("Full params:", params);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        console.log("Fetching workspace with ID:", workspaceId);
        const response = await fetch(`/api/workspaces/${workspaceId}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch workspace: ${response.status}`);
        }

        const data = await response.json();
        console.log("Workspace data:", data);

        setWorkspace(data);
        setWorkspaceName(data.name);
        setIconPreview(data.iconUrl);
      } catch (error) {
        console.error("Error fetching workspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInviteLink = async () => {
      try {
        // Since there is no GET endpoint for invites anymore, we can just generate a new one.
        // Or we can retrieve the existing one if we modify the API.
        // For now, let's just generate a new one each time the page loads.
        await handleResetInviteLink(true);
      } catch (error) {
        console.error("Error fetching invite link:", error);
      }
    };

    if (workspaceId) {
      fetchWorkspace();
      fetchInviteLink();
    } else {
      console.error("No workspaceId provided");
      setIsLoading(false);
    }
  }, [workspaceId]);

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const formData = new FormData();
      formData.append("name", workspaceName);

      const fileInput = document.getElementById("icon") as HTMLInputElement;
      if (fileInput.files && fileInput.files.length > 0) {
        formData.append("icon", fileInput.files[0]);
      }

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        alert("Changes saved successfully!");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("An error occurred while saving changes");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          router.push("/dashboard");
        } else {
          alert("Failed to delete workspace");
        }
      } catch (error) {
        console.error(error);
        alert("An error occurred");
      }
    }
  };

  const handleResetInviteLink = async (silent = false) => {
    try {
      const response = await fetch(`/api/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });
      if (response.ok) {
        const data = await response.json();
        setInviteLink(`http://localhost:3000/invite?code=${data.code}`);
        if (!silent) alert("邀请链接已重置。");
      } else {
        if (!silent) alert("重置邀请链接失败。");
      }
    } catch (error) {
      console.error("重置邀请链接时出错:", error);
      if (!silent) alert("重置邀请链接时发生错误。");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!workspace) {
    return <div className="p-8">Workspace not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href={`/dashboard/workspaces/${workspaceId}`} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back</span>
        </Link>
        <h1 className="text-xl font-semibold ml-4">{workspace.name}</h1>
      </div>

      <div className="space-y-8">
        {/* Workspace Name */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-base font-medium mb-4">Workspace Name</h2>
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="mb-4"
          />
        </div>

        {/* Workspace Icon */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-base font-medium mb-2">Workspace Icon</h2>
          <p className="text-sm text-gray-500 mb-4">JPG, PNG, SVG or JPEG, max 1mb</p>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border overflow-hidden">
              {iconPreview ? (
                <Image
                  src={iconPreview}
                  alt="Workspace icon"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="text-2xl font-semibold text-gray-400">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <Input
                type="file"
                id="icon"
                className="hidden"
                accept="image/jpeg,image/png,image/svg+xml"
                onChange={handleIconChange}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("icon")?.click()}
              >
                Upload Image
              </Button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </div>

        {/* Invite Members */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-base font-medium mb-2">Invite Members</h2>
          <p className="text-sm text-gray-500 mb-4">Use the invite link to add members to your workspace.</p>

          <div className="flex items-center space-x-2">
            <Input value={inviteLink} readOnly className="bg-gray-50" />
            <Button variant="ghost" size="icon" onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              alert("Link copied to clipboard!");
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </Button>
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={() => handleResetInviteLink()}>
              Reset invite link
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-base font-medium mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">Deleting a workspace is irreversible and will remove all associated data.</p>

          <Button
            variant="destructive"
            onClick={handleDeleteWorkspace}
          >
            Delete Workspace
          </Button>
        </div>
      </div>
    </div>
  );
} 