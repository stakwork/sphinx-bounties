"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "@/lib";

const getCurrentUserPubkey = (): string => {
  // TODO: Implement actual authentication
  return "temp-pubkey-placeholder";
};

export async function createUserAction(formData: FormData) {
  try {
    const pubkey = formData.get("pubkey") as string;
    const username = formData.get("username") as string;
    const alias = formData.get("alias") as string;
    const description = formData.get("description") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const contactKey = formData.get("contactKey") as string;

    if (!pubkey || !username) {
      throw new ValidationError("Pubkey and username are required");
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ pubkey }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.pubkey === pubkey) {
        throw new ConflictError("A user with this pubkey already exists");
      }
      if (existingUser.username === username) {
        throw new ConflictError("This username is already taken");
      }
    }

    const user = await db.user.create({
      data: {
        pubkey,
        username,
        alias: alias || null,
        description: description || null,
        avatarUrl: avatarUrl || null,
        contactKey: contactKey || null,
      },
    });

    revalidatePath("/people");
    revalidatePath(`/people/${pubkey}`);

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Create user error:", error);
    throw error;
  }
}

export async function updateProfileAction(pubkey: string, formData: FormData) {
  try {
    const currentUserPubkey = getCurrentUserPubkey();

    if (currentUserPubkey !== pubkey) {
      throw new ForbiddenError("You can only update your own profile");
    }

    const user = await db.user.findUnique({
      where: { pubkey },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const username = formData.get("username") as string;
    const alias = formData.get("alias") as string;
    const description = formData.get("description") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const contactKey = formData.get("contactKey") as string;
    const routeHint = formData.get("routeHint") as string;

    if (username && username !== user.username) {
      const existingUser = await db.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new ConflictError("This username is already taken");
      }
    }

    const updatedUser = await db.user.update({
      where: { pubkey },
      data: {
        ...(username && { username }),
        alias: alias || null,
        description: description || null,
        avatarUrl: avatarUrl || null,
        contactKey: contactKey || null,
        routeHint: routeHint || null,
      },
    });

    revalidatePath("/people");
    revalidatePath(`/people/${pubkey}`);
    revalidatePath("/settings");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
}

export async function updateSocialLinksAction(pubkey: string, formData: FormData) {
  try {
    const currentUserPubkey = getCurrentUserPubkey();

    if (currentUserPubkey !== pubkey) {
      throw new ForbiddenError("You can only update your own social links");
    }

    const user = await db.user.findUnique({
      where: { pubkey },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const githubUsername = formData.get("githubUsername") as string;
    const twitterUsername = formData.get("twitterUsername") as string;

    const githubChanged = githubUsername && githubUsername !== user.githubUsername;
    const twitterChanged = twitterUsername && twitterUsername !== user.twitterUsername;

    const updatedUser = await db.user.update({
      where: { pubkey },
      data: {
        githubUsername: githubUsername || null,
        githubVerified: githubChanged ? false : user.githubVerified,
        twitterUsername: twitterUsername || null,
        twitterVerified: twitterChanged ? false : user.twitterVerified,
      },
    });

    revalidatePath("/people");
    revalidatePath(`/people/${pubkey}`);
    revalidatePath("/settings");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Update social links error:", error);
    throw error;
  }
}

export async function updateNotificationSettingsAction(pubkey: string) {
  try {
    const currentUserPubkey = getCurrentUserPubkey();

    if (currentUserPubkey !== pubkey) {
      throw new ForbiddenError("You can only update your own settings");
    }

    const user = await db.user.findUnique({
      where: { pubkey },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    revalidatePath("/settings");

    return {
      success: true,
      data: { message: "Notification settings saved" },
    };
  } catch (error) {
    console.error("Update notification settings error:", error);
    throw error;
  }
}

export async function deleteUserAction(pubkey: string, formData: FormData) {
  try {
    const currentUserPubkey = getCurrentUserPubkey();

    if (currentUserPubkey !== pubkey) {
      throw new ForbiddenError("You can only delete your own account");
    }

    const confirmation = formData.get("confirmation") as string;

    if (confirmation !== "DELETE") {
      throw new ValidationError("Please type DELETE to confirm account deletion");
    }

    const user = await db.user.findUnique({
      where: { pubkey },
      include: {
        createdWorkspaces: {
          where: { deletedAt: null },
        },
        assignedBounties: {
          where: {
            status: {
              in: ["ASSIGNED", "IN_REVIEW"],
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.createdWorkspaces.length > 0) {
      throw new ConflictError(
        "Cannot delete account while you own active workspaces. Please delete or transfer ownership of your workspaces first."
      );
    }

    if (user.assignedBounties.length > 0) {
      throw new ConflictError(
        "Cannot delete account while you have assigned or in-review bounties. Please complete or unassign them first."
      );
    }

    await db.user.update({
      where: { pubkey },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/people");

    return {
      success: true,
      data: { id: pubkey },
    };
  } catch (error) {
    console.error("Delete user error:", error);
    throw error;
  }
}

export async function verifyGithubAction(pubkey: string, formData: FormData) {
  try {
    const currentUserPubkey = getCurrentUserPubkey();

    if (currentUserPubkey !== pubkey) {
      throw new ForbiddenError("You can only verify your own GitHub account");
    }

    const code = formData.get("code") as string;

    if (!code) {
      throw new ValidationError("Verification code is required");
    }

    const user = await db.user.findUnique({
      where: { pubkey },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.githubUsername) {
      throw new ValidationError("Please set your GitHub username first");
    }

    return {
      success: true,
      data: { message: "GitHub verification will be implemented with OAuth integration" },
    };
  } catch (error) {
    console.error("Verify GitHub error:", error);
    throw error;
  }
}

export async function verifyTwitterAction(pubkey: string, formData: FormData) {
  try {
    const currentUserPubkey = getCurrentUserPubkey();

    if (currentUserPubkey !== pubkey) {
      throw new ForbiddenError("You can only verify your own Twitter account");
    }

    const code = formData.get("code") as string;

    if (!code) {
      throw new ValidationError("Verification code is required");
    }

    const user = await db.user.findUnique({
      where: { pubkey },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.twitterUsername) {
      throw new ValidationError("Please set your Twitter username first");
    }

    return {
      success: true,
      data: { message: "Twitter verification will be implemented with OAuth integration" },
    };
  } catch (error) {
    console.error("Verify Twitter error:", error);
    throw error;
  }
}
