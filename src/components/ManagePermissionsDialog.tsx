"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Project {
  id: string;
  name: string;
}

interface Permission {
  projectId: string;
  canView: boolean;
  canEdit: boolean;
}

interface ManagePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    userId: string;
    name: string | null;
    username: string;
    projectPermissions: Permission[];
  };
  workspaceId: string;
  onPermissionsUpdated: (userId: string, newPermissions: Permission[]) => void;
}

export const ManagePermissionsDialog = ({
  isOpen,
  onClose,
  member,
  workspaceId,
  onPermissionsUpdated,
}: ManagePermissionsDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermissions(member.projectPermissions || []);
      fetchProjects();
    }
  }, [isOpen, member]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);

        // Initialize permissions for projects that don't have existing settings
        const initialPermissions = [...permissions];
        data.forEach((project: Project) => {
          const existingPermission = initialPermissions.find(p => p.projectId === project.id);
          if (!existingPermission) {
            initialPermissions.push({
              projectId: project.id,
              canView: true,
              canEdit: false
            });
          }
        });

        setPermissions(initialPermissions);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (projectId: string, type: 'canView' | 'canEdit', value: boolean) => {
    setPermissions(prev =>
      prev.map(p =>
        p.projectId === projectId
          ? { ...p, [type]: value, ...((type === 'canView' && !value) && { canEdit: false }) }
          : p
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Save permissions to the server
      const apiCalls = permissions.map(permission =>
        fetch(`/api/workspaces/${workspaceId}/members/${member.userId}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(permission),
        })
      );

      await Promise.all(apiCalls);

      // Update parent component's state
      onPermissionsUpdated(member.userId, permissions);
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("There was an error saving permissions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {member.name || member.username}</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-center py-4">Loading...</p>}
        <div className="grid gap-4 py-4">
          {projects.map(project => {
            const permission = permissions.find(p => p.projectId === project.id) || { canView: true, canEdit: false };
            return (
              <div key={project.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`project-${project.id}`} className="col-span-2">{project.name}</Label>
                <div className="col-span-1 flex items-center space-x-2">
                  <Label htmlFor={`view-${project.id}`}>View</Label>
                  <Switch
                    id={`view-${project.id}`}
                    checked={permission.canView}
                    onCheckedChange={(value: boolean) => handlePermissionChange(project.id, 'canView', value)}
                  />
                </div>
                <div className="col-span-1 flex items-center space-x-2">
                  <Label htmlFor={`edit-${project.id}`}>Edit</Label>
                  <Switch
                    id={`edit-${project.id}`}
                    checked={permission.canEdit}
                    onCheckedChange={(value: boolean) => handlePermissionChange(project.id, 'canEdit', value)}
                    disabled={!permission.canView}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 