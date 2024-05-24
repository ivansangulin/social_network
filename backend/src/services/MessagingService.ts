import { PrismaClient } from "@prisma/client";
import { areFriends } from "./FriendshipService";
import {
  findUserUuidById,
  getFriendIdFromUuid,
  myMessagingData,
} from "./UserService";

const prisma = new PrismaClient();

const MESSAGES_PAGING_TAKE = 20;

export const createMessage = async (
  userId: number,
  friendUuid: string,
  message: string
) => {
  const friendId = await getFriendIdFromUuid(friendUuid);

  const friends = await areFriends(userId, friendId);
  if (!friends) {
    throw new Error("Not friends..");
  }

  await prisma.message.create({
    select: {
      created: true,
    },
    data: {
      from_user_id: userId,
      to_user_id: friendId,
      message: message,
    },
  });

  const myData = await myMessagingData(userId);
  return myData;
};

export const getMessages = async (
  userId: number,
  friendUuid: string,
  cursor: number | undefined
) => {
  const friendId = await getFriendIdFromUuid(friendUuid);

  const friends = await areFriends(userId, friendId);
  if (!friends) {
    throw new Error("Not friends!");
  }

  const [count, messages] = await Promise.all([
    prisma.message.count({
      where: {
        OR: [
          { AND: [{ to_user_id: userId }, { from_user_id: friendId }] },
          { AND: [{ to_user_id: friendId }, { from_user_id: userId }] },
        ],
      },
    }),
    prisma.message.findMany({
      take: MESSAGES_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        message: true,
        to_user_id: true,
        from_user_id: true,
        created: true,
        id: true,
      },
      where: {
        OR: [
          { AND: [{ to_user_id: userId }, { from_user_id: friendId }] },
          { AND: [{ to_user_id: friendId }, { from_user_id: userId }] },
        ],
      },
      orderBy: { created: "desc" },
    }),
  ]);

  const userUuid = await findUserUuidById(userId);

  const messagesMapped: { sender: string; message: string }[] = messages.map(
    (msg) => {
      if (msg.from_user_id === userId) {
        return { sender: userUuid, message: msg.message };
      }
      return { sender: friendUuid, message: msg.message };
    }
  );

  const messagesPaging = {
    count,
    messages: messagesMapped,
    cursor: messages.length > 0 ? messages[messages.length - 1].id : 0,
  };

  return messagesPaging;
};
