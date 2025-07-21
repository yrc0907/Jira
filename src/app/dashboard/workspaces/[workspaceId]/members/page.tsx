"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, UserCog, Shield, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ManagePermissionsDialog } from "@/components/ManagePermissionsDialog";

interface Permission {
  projectId: string;
  canView: boolean;
  canEdit: boolean;
}

interface Member {
  id: string;
  userId: string;
  name: string | null;
  username: string;
  role: string;
  memberId: string;
  projectPermissions: Permission[];
}

interface CurrentUser extends Member { }

const MembersPage = () => {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members`
      );
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
        setCurrentUser(data.currentUser);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch members");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canManagePermissions = (targetMember: Member) => {
    if (!currentUser) return false;
    if (currentUser.role === 'OWNER') {
      return currentUser.userId !== targetMember.userId;
    }
    if (currentUser.role === 'ADMIN') {
      return targetMember.role === 'MEMBER';
    }
    return false;
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Optimistic update for role change
    const updatedMembers = members.map(member =>
      member.userId === userId ? { ...member, role: newRole.toUpperCase() } : member
    );
    setMembers(updatedMembers);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        // Revert changes on error
        alert('Failed to change role');
        fetchMembers();
      }
    } catch (error) {
      console.error("Error changing role:", error);
      alert('An error occurred while changing role.');
      fetchMembers();
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      // Optimistic update for removing member
      const originalMembers = [...members];
      setMembers(members.filter(member => member.userId !== userId));

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          // Revert changes on error
          const errorData = await response.json();
          alert(`Failed to remove member: ${errorData.error}`);
          setMembers(originalMembers);
        }
      } catch (error) {
        console.error("Error removing member:", error);
        alert('An error occurred while removing the member.');
        setMembers(originalMembers);
      }
    }
  };

  const handlePermissionsUpdated = (userId: string, newPermissions: Permission[]) => {
    // Update the member's permissions in the state
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.userId === userId
          ? { ...member, projectPermissions: newPermissions }
          : member
      )
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return <Shield className="h-4 w-4 mr-2 text-yellow-500" />;
      case 'ADMIN':
        return <UserCog className="h-4 w-4 mr-2 text-blue-500" />;
      default:
        return <UserCog className="h-4 w-4 mr-2 text-gray-400" />;
    }
  }


  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-semibold mb-6">Workspace Members</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li
              key={member.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600 mr-4">
                    {member.name ? member.name.charAt(0).toUpperCase() : member.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{member.name || member.username}</p>
                    <p className="text-sm text-gray-500">{member.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="mr-4 capitalize flex items-center">
                    {getRoleIcon(member.role)}
                    {member.role.toLowerCase()}
                  </Badge>

                  {canManagePermissions(member) && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedMember(member)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Permissions
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {currentUser && currentUser.role === 'OWNER' && member.role === 'MEMBER' && (
                        <DropdownMenuItem onSelect={() => handleRoleChange(member.userId, 'admin')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>Make Admin</span>
                        </DropdownMenuItem>
                      )}
                      {currentUser && currentUser.role === 'OWNER' && member.role === 'ADMIN' && (
                        <DropdownMenuItem onSelect={() => handleRoleChange(member.userId, 'member')}>
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>Make Member</span>
                        </DropdownMenuItem>
                      )}
                      {currentUser && currentUser.userId !== member.userId && (currentUser.role === 'OWNER' || (currentUser.role === 'ADMIN' && member.role === 'MEMBER')) && (
                        <DropdownMenuItem onSelect={() => handleRemoveMember(member.userId)} className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {selectedMember && (
        <ManagePermissionsDialog
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          member={selectedMember}
          workspaceId={workspaceId}
          onPermissionsUpdated={handlePermissionsUpdated}
        />
      )}
    </div>
  );
};

export default MembersPage;
