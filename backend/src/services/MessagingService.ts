import { PrismaClient } from "@prisma/client";
import { areFriends } from "./FriendshipService";
import { findUserUuidById } from "./UserService";

const prisma = new PrismaClient();

const MESSAGES_PAGING_TAKE = 20;

const getFriendIdFromUuid = async (friendUuid: string) => {
  const { id: friendId } = await prisma.user.findUniqueOrThrow({
    select: {
      id: true,
    },
    where: {
      uuid: friendUuid,
    },
  });
  return friendId;
};

export const createMessage = async (
  userId: number,
  friendUuid: string,
  message: string,
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

  const userUuid = await findUserUuidById(userId);

  return userUuid;
};

export const getMessages = async (
  userId: number,
  friendUuid: string,
  chatUuid: string,
  cursor: number | undefined
) => {
  const friendId = await getFriendIdFromUuid(friendUuid);

  const friends = await areFriends(userId, friendId);
  if (!friends) {
    throw new Error("Not friends!");
  }

  const messages = await prisma.message.findMany({
    take: MESSAGES_PAGING_TAKE,
    skip: !!cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    select: {
      message: true,
      to_user_id: true,
      from_user_id: true,
      created: true,
    },
    where: {
      OR: [
        { AND: [{ to_user_id: userId }, { from_user_id: friendId }] },
        { AND: [{ to_user_id: friendId }, { from_user_id: userId }] },
      ],
    },
    orderBy: { created: "desc" },
  });

  const userUuid = await findUserUuidById(userId);

  const messagesMapped: { sender: string; message: string }[] = messages.map(
    (msg) => {
      if (msg.from_user_id === userId) {
        return { sender: userUuid, message: msg.message };
      }
      return { sender: friendUuid, message: msg.message };
    }
  );

  return messagesMapped;
};
