"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "@/lib";
import { WorkspaceRole } from "@prisma/client";

const getCurrentUserPubkey = (): string => {
  // TODO: Implement actual authentication
  return "temp-pubkey-placeholder";
};

export async function createWorkspaceAction(formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const mission = formData.get("mission") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const websiteUrl = formData.get("websiteUrl") as string;
    const githubUrl = formData.get("githubUrl") as string;

    if (!name) {
      throw new ValidationError("Workspace name is required");
    }

    const existingWorkspace = await db.workspace.findUnique({
      where: { name },
    });

    if (existingWorkspace) {
      throw new ConflictError("A workspace with this name already exists");
    }

    const workspace = await db.workspace.create({
      data: {
        name,
        ownerPubkey: userPubkey,
        description: description || null,
        mission: mission || null,
        avatarUrl: avatarUrl || null,
        websiteUrl: websiteUrl || null,
        githubUrl: githubUrl || null,
      },
    });

    await db.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userPubkey,
        role: WorkspaceRole.OWNER,
      },
    });

    revalidatePath("/workspaces");

    return {
      success: true,
      data: workspace,
    };
  } catch (error) {
    console.error("Create workspace error:", error);
    throw error;
  }
}

export async function updateWorkspaceAction(workspaceId: string, formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const member = workspace.members[0];
    if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
      throw new ForbiddenError("Only workspace admins can update workspace details");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const mission = formData.get("mission") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const websiteUrl = formData.get("websiteUrl") as string;
    const githubUrl = formData.get("githubUrl") as string;

    if (name && name !== workspace.name) {
      const existingWorkspace = await db.workspace.findUnique({
        where: { name },
      });

      if (existingWorkspace) {
        throw new ConflictError("A workspace with this name already exists");
      }
    }

    const updatedWorkspace = await db.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name && { name }),
        description: description || null,
        mission: mission || null,
        avatarUrl: avatarUrl || null,
        websiteUrl: websiteUrl || null,
        githubUrl: githubUrl || null,
      },
    });

    revalidatePath("/workspaces");
    revalidatePath(`/workspaces/${workspaceId}`);

    return {
      success: true,
      data: updatedWorkspace,
    };
  } catch (error) {
    console.error("Update workspace error:", error);
    throw error;
  }
}

export async function deleteWorkspaceAction(workspaceId: string) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userPubkey },
        },
        bounties: {
          where: {
            status: {
              in: ["OPEN", "ASSIGNED", "IN_REVIEW"],
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const member = workspace.members[0];
    if (!member || member.role !== "OWNER") {
      throw new ForbiddenError("Only the workspace owner can delete the workspace");
    }

    if (workspace.bounties.length > 0) {
      throw new ConflictError(
        "Cannot delete workspace with active bounties. Please close or cancel all bounties first."
      );
    }

    await db.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/workspaces");

    return {
      success: true,
      data: { id: workspaceId },
    };
  } catch (error) {
    console.error("Delete workspace error:", error);
    throw error;
  }
}

export async function addMemberAction(workspaceId: string, formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const memberPubkey = formData.get("userPubkey") as string;
    const role = formData.get("role") as WorkspaceRole;

    if (!memberPubkey) {
      throw new ValidationError("Member pubkey is required");
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const requesterMember = workspace.members[0];
    if (
      !requesterMember ||
      (requesterMember.role !== "ADMIN" && requesterMember.role !== "OWNER")
    ) {
      throw new ForbiddenError("Only workspace admins can add members");
    }

    const memberUser = await db.user.findUnique({
      where: { pubkey: memberPubkey },
    });

    if (!memberUser) {
      throw new NotFoundError("User not found");
    }

    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId,
          userPubkey: memberPubkey,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError("User is already a member of this workspace");
    }

    const newMember = await db.workspaceMember.create({
      data: {
        workspaceId,
        userPubkey: memberPubkey,
        role: role || WorkspaceRole.CONTRIBUTOR,
      },
      include: {
        user: true,
      },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    revalidatePath(`/workspaces/${workspaceId}/members`);

    return {
      success: true,
      data: newMember,
    };
  } catch (error) {
    console.error("Add member error:", error);
    throw error;
  }
}

export async function updateMemberRoleAction(
  workspaceId: string,
  membershipId: string,
  formData: FormData
) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const newRole = formData.get("role") as WorkspaceRole;

    if (!newRole) {
      throw new ValidationError("Role is required");
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const requesterMember = workspace.members[0];
    if (!requesterMember || requesterMember.role !== "OWNER") {
      throw new ForbiddenError("Only the workspace owner can update member roles");
    }

    const targetMember = await db.workspaceMember.findUnique({
      where: { id: membershipId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundError("Member not found in this workspace");
    }

    if (targetMember.userPubkey === workspace.ownerPubkey && newRole !== "OWNER") {
      throw new ForbiddenError("Cannot change the owner's role");
    }

    const updatedMember = await db.workspaceMember.update({
      where: { id: membershipId },
      data: { role: newRole },
      include: {
        user: true,
      },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    revalidatePath(`/workspaces/${workspaceId}/members`);

    return {
      success: true,
      data: updatedMember,
    };
  } catch (error) {
    console.error("Update member role error:", error);
    throw error;
  }
}

export async function removeMemberAction(workspaceId: string, membershipId: string) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const requesterMember = workspace.members[0];
    if (
      !requesterMember ||
      (requesterMember.role !== "ADMIN" && requesterMember.role !== "OWNER")
    ) {
      throw new ForbiddenError("Only workspace admins can remove members");
    }

    const targetMember = await db.workspaceMember.findUnique({
      where: { id: membershipId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundError("Member not found in this workspace");
    }

    if (targetMember.userPubkey === workspace.ownerPubkey) {
      throw new ForbiddenError("Cannot remove the workspace owner");
    }

    await db.workspaceMember.delete({
      where: { id: membershipId },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
    revalidatePath(`/workspaces/${workspaceId}/members`);

    return {
      success: true,
      data: { id: membershipId },
    };
  } catch (error) {
    console.error("Remove member error:", error);
    throw error;
  }
}
