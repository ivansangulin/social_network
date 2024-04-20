import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getFriends = async (userId: number) => {
  try {
    const friends = await prisma.friendship.findMany({
      select: {
        friend: {
          select: {
            username: true,
            uuid: true,
          },
        },
      },
      where: {
        user_id: userId,
      },
    });

    return friends;
  } catch (err) {
    return [];
  }
};
