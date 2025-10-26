"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetWorkspace } from "@/hooks/queries/use-workspace-queries";
import { WorkspaceForm } from "@/components/workspaces";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const { data: workspace, isLoading, error } = useGetWorkspace(workspaceId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Workspace Not Found</h3>
          <p className="text-neutral-600 mb-4">
            The workspace you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have
            permission.
          </p>
          <Link href="/workspaces">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspaces
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is admin (role should be 'OWNER' or 'ADMIN')
  const isAdmin = workspace.role === "OWNER" || workspace.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-neutral-600 mb-4">
            Only workspace admins can edit workspace settings.
          </p>
          <Link href={`/workspaces/${workspaceId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Workspace</h1>
          <p className="text-neutral-600">Update workspace details and settings</p>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <WorkspaceForm workspace={workspace} />
      </div>
    </div>
  );
}
