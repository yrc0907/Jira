"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewWorkspacePage() {
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const router = useRouter();

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIconPreview(null);
    }
  };

  const action = async (formData: FormData) => {
    const result = await createWorkspace(formData);
    if (result?.error) {
      alert(result.error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create a new workspace</CardTitle>
          <CardDescription>
            Workspaces are shared environments where you can collaborate with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Acme Inc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Workspace Icon</Label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="icon"
                  name="icon"
                  type="file"
                  onChange={handleIconChange}
                  className="w-full"
                  accept="image/*"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Create Workspace</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 