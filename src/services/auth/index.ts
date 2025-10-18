import { db } from "@/lib/db";

export const authService = {
  async validateUser(pubKey: string) {
    const user = await db.user.findUnique({
      where: { pubkey: pubKey },
    });
    return user;
  },

  async createSession(userId: string) {
    return {
      userId,
      createdAt: new Date(),
    };
  },
};
