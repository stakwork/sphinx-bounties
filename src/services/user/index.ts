import { db } from "@/lib/db";

export const userService = {
  async findByPubKey(pubKey: string) {
    return db.user.findUnique({
      where: { pubKey },
    });
  },


  async create(data: { username: string;}) {
    return db.user.create({
      data,
    });
  },

  async update(pubKey: string, data: { username?: string; }) {
    return db.user.update({
      where: { pubKey },
      data,
    });
  },

  async delete(pubKey: string) {
    return db.user.delete({
      where: { pubKey },
    });
  },
};
