"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/lib";

const getCurrentUserPubkey = (): string => {
  // TODO: Implement actual authentication
  return "temp-pubkey-placeholder";
};

export async function createBountyAction(formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();
    
    const workspaceId = formData.get("workspaceId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const amount = BigInt(formData.get("amount") as string);
    
    if (!workspaceId || !title || !description || !amount) {
      throw new ValidationError("Missing required fields");
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

    const member = workspace.members[0];
    if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
      throw new ForbiddenError("Only workspace admins can create bounties");
    }

    const bounty = await db.bounty.create({
      data: {
        workspaceId,
        creatorPubkey: userPubkey,
        title,
        description,
        deliverables: description,
        amount,
        status: "DRAFT",
        tags: [],
        codingLanguages: [],
      },
    });

    revalidatePath("/bounties");
    revalidatePath(`/workspaces/${workspaceId}`);

    return {
      success: true,
      data: bounty,
    };
  } catch (error) {
    console.error("Create bounty error:", error);
    throw error;
  }
}

export async function updateBountyAction(bountyId: string, formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const bounty = await db.bounty.findUnique({
      where: { id: bountyId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userPubkey },
            },
          },
        },
      },
    });

    if (!bounty) {
      throw new NotFoundError("Bounty not found");
    }

    const member = bounty.workspace.members[0];
    if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
      throw new ForbiddenError("Only workspace admins can update bounties");
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const amount = formData.get("amount") as string;

    const updatedBounty = await db.bounty.update({
      where: { id: bountyId },
      data: {
        ...(title && { title }),
        ...(description && { description, deliverables: description }),
        ...(amount && { amount: BigInt(amount) }),
      },
    });

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${bountyId}`);

    return {
      success: true,
      data: updatedBounty,
    };
  } catch (error) {
    console.error("Update bounty error:", error);
    throw error;
  }
}

export async function assignBountyAction(bountyId: string, assigneePubkey: string) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const bounty = await db.bounty.findUnique({
      where: { id: bountyId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userPubkey },
            },
          },
        },
      },
    });

    if (!bounty) {
      throw new NotFoundError("Bounty not found");
    }

    if (bounty.status !== "OPEN") {
      throw new ConflictError("Bounty is not available for assignment");
    }

    const member = bounty.workspace.members[0];
    const canAssign =
      (member && (member.role === "ADMIN" || member.role === "OWNER")) ||
      assigneePubkey === userPubkey;

    if (!canAssign) {
      throw new ForbiddenError("Cannot assign this bounty");
    }

    const updatedBounty = await db.bounty.update({
      where: { id: bountyId },
      data: {
        assigneePubkey,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${bountyId}`);

    return {
      success: true,
      data: updatedBounty,
    };
  } catch (error) {
    console.error("Assign bounty error:", error);
    throw error;
  }
}

export async function submitProofAction(bountyId: string, formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const proofUrl = formData.get("proofUrl") as string;
    const description = formData.get("description") as string;

    if (!proofUrl || !description) {
      throw new ValidationError("Proof URL and description are required");
    }

    const bounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new NotFoundError("Bounty not found");
    }

    if (bounty.assigneePubkey !== userPubkey) {
      throw new ForbiddenError("Only the assigned user can submit proof");
    }

    if (bounty.status !== "ASSIGNED") {
      throw new ConflictError("Bounty is not in a state to accept proof");
    }

    const proof = await db.bountyProof.create({
      data: {
        bountyId,
        submittedByPubkey: userPubkey,
        proofUrl,
        description,
        status: "PENDING",
      },
    });

    await db.bounty.update({
      where: { id: bountyId },
      data: { status: "IN_REVIEW" },
    });

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${bountyId}`);

    return {
      success: true,
      data: proof,
    };
  } catch (error) {
    console.error("Submit proof error:", error);
    throw error;
  }
}

export async function reviewProofAction(proofId: string, formData: FormData) {
  try {
    const userPubkey = getCurrentUserPubkey();

    const approved = formData.get("approved") === "true";
    const reviewNotes = formData.get("reviewNotes") as string;

    const proof = await db.bountyProof.findUnique({
      where: { id: proofId },
      include: {
        bounty: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userPubkey },
                },
              },
            },
          },
        },
      },
    });

    if (!proof) {
      throw new NotFoundError("Proof not found");
    }

    const member = proof.bounty.workspace.members[0];
    if (!member || (member.role !== "ADMIN" && member.role !== "OWNER")) {
      throw new ForbiddenError("Only workspace admins can review proofs");
    }

    if (proof.status !== "PENDING") {
      throw new ConflictError("Proof has already been reviewed");
    }

    const updatedProof = await db.bountyProof.update({
      where: { id: proofId },
      data: {
        status: approved ? "ACCEPTED" : "REJECTED",
        reviewNotes,
        reviewedByPubkey: userPubkey,
        reviewedAt: new Date(),
      },
    });

    if (approved) {
      await db.bounty.update({
        where: { id: proof.bountyId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } else {
      await db.bounty.update({
        where: { id: proof.bountyId },
        data: { status: "ASSIGNED" },
      });
    }

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${proof.bountyId}`);

    return {
      success: true,
      data: updatedProof,
    };
  } catch (error) {
    console.error("Review proof error:", error);
    throw error;
  }
}
