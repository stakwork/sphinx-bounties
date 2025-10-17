import { userService } from "@/services/user";

export const authService = {
  async validateUser(pubKey: string) {
    const user = await userService.findByPubKey(pubKey);
    return user;
  },

  async createSession(userId: string) {
    return {
      userId,
      createdAt: new Date(),
    };
  },
};
