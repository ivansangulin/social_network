import { PrismaClient } from "@prisma/client";
import { calculateAwayTime } from "../services/FriendshipService";
import { calculateTime } from "../services/PostService";

export const prisma = new PrismaClient().$extends({
  result: {
    userStatus: {
      last_seen: {
        needs: { last_active: true },
        compute(data) {
          return calculateAwayTime(data.last_active);
        },
      },
    },
    post: {
      createdLocalDate: {
        needs: { created: true },
        compute(data) {
          return calculateTime(data.created);
        },
      },
    },
  },
});
