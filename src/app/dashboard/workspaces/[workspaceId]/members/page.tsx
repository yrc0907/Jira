"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";

interface WorkspaceUser {
  id: string;
  name?: string | null;
  username: string;
  role: string;
}

export default function MembersPage() {
  const params = useParams();
  const { data: session } = useSession();
  const workspaceId = params.workspaceId as string;
  const [members, setMembers] = useState<WorkspaceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/users`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      } else {
        throw new Error("Failed to fetch members");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("加载成员列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  const handleMemberAdded = () => {
    fetchMembers();
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm("确定要移除该成员吗？")) {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '移除成员失败');
        }

        toast.success('成员已移除');
        fetchMembers();
      } catch (error: any) {
        console.error('Error removing member:', error);
        toast.error(error.message || '移除成员失败');
      }
    }
  };

  const currentUserIsOwner = members.find(m => m.id === session?.user?.id)?.role === 'owner';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">成员</h1>
          <p className="text-gray-500">管理您的工作区成员</p>
        </div>
        {currentUserIsOwner && <AddMemberDialog workspaceId={workspaceId} onMemberAdded={handleMemberAdded} />}
      </div>

      <div className="bg-white border rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center">加载中...</div>
        ) : (
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback>
                      {member.name?.[0] || member.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name || member.username}</p>
                    <p className="text-sm text-gray-500">{member.username}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4 capitalize">
                    {member.role}
                  </span>
                  {currentUserIsOwner && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          移除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
