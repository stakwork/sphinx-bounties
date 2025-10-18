import { db } from "@/lib/db";

export const userService = {
  async findByPubKey(pubKey: string) {
    return db.user.findUnique({
      where: { pubkey: pubKey },
    });
  },

  async create(data: { username: string; pubkey: string }) {
    return db.user.create({
      data,
    });
  },

  async update(pubKey: string, data: { username?: string }) {
    return db.user.update({
      where: { pubkey: pubKey },
      data,
    });
  },

  async delete(pubKey: string) {
    return db.user.delete({
      where: { pubkey: pubKey },
    });
  },
};
