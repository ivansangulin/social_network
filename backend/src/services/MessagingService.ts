import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getChatUuid = async (userId: number, friendUuid: string) => {
  const { id: friendId } = await prisma.user.findUniqueOrThrow({
    select: {
      id: true,
    },
    where: {
      uuid: friendUuid,
    },
  });

  const chat = await prisma.chat.findFirst({
    select: {
      uuid: true,
    },
    where: {
      OR: [
        {
          AND: [
            {
              user_id: userId,
            },
            {
              friend_id: friendId,
            },
          ],
        },
        {
          AND: [
            {
              user_id: friendId,
            },
            {
              friend_id: userId,
            },
          ],
        },
      ],
    },
  });

  if (!chat) {
    const { uuid: newChatUuid } = await prisma.chat.create({
      data: {
        user_id: userId,
        friend_id: friendId,
      },
      select: {
        uuid: true,
      },
    });
    return newChatUuid;
  }

  return chat.uuid;
};
