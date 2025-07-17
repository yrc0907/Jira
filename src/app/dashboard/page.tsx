"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
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
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create a new workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="workspaceName" className="font-medium">
                Workspace Name
              </Label>
              <Input
                id="workspaceName"
                name="name"
                placeholder="Enter workspace name"
                required
                className="max-w-md"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Workspace Icon</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border overflow-hidden">
                  {iconPreview ? (
                    <img
                      src={iconPreview}
                      alt="Icon Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    JPG, PNG, SVG or JPEG, max 1mb
                  </p>
                  <Input
                    type="file"
                    id="icon"
                    name="icon"
                    className="hidden"
                    accept="image/jpeg,image/png,image/svg+xml,image/jpeg"
                    onChange={handleIconChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("icon")?.click()}
                  >
                    Upload Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit">Create Workspace</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 