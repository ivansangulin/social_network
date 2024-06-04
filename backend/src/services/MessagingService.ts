import { areFriends } from "./FriendshipService";
import { myMessagingData } from "./UserService";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { prisma } from "../utils/client";

const MESSAGES_PAGING_TAKE = 20;

export const createMessage = async (
  userId: string,
  friendId: string,
  message: string,
  created: Date
) => {
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
      created: created,
    },
  });

  const myData = await myMessagingData(userId);
  return myData;
};

export const getMessages = async (
  userId: string,
  friendId: string,
  cursor: string | undefined
) => {
  const friends = await areFriends(userId, friendId);
  if (!friends) {
    throw new Error("Not friends!");
  }

  const [count, messages, lastMessageReadTime] = await Promise.all([
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
    prisma.message.findFirst({
      select: {
        from_user_id: true,
        read_at: true,
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

  const messagesMapped: { sender: string; message: string; created: Date }[] =
    messages.map((msg) => {
      if (msg.from_user_id === userId) {
        return {
          sender: userId,
          message: msg.message,
          created: msg.created,
        };
      }
      return {
        sender: friendId,
        message: msg.message,
        created: msg.created,
      };
    });

  const messagesPaging = {
    count,
    messages: messagesMapped,
    lastMessageReadTime:
      !!lastMessageReadTime?.read_at &&
      lastMessageReadTime.from_user_id === userId
        ? calculateLastSeen(lastMessageReadTime.read_at)
        : null,
    cursor: messages.length > 0 ? messages[messages.length - 1].id : "",
  };

  return messagesPaging;
};

const calculateLastSeen = (last_active: Date) => {
  const now = new Date();
  const diffYears = differenceInYears(now, last_active);
  const diffMonths = differenceInMonths(now, last_active);
  const diffDays = differenceInDays(now, last_active);
  const diffHours = differenceInHours(now, last_active);
  const diffMinutes = differenceInMinutes(now, last_active);

  if (diffMinutes < 1) {
    return "Seen just now";
  } else if (diffMinutes < 60) {
    return `Seen ${diffMinutes}min ago`;
  } else if (diffHours < 24) {
    return `Seen ${diffHours}h ago`;
  } else if (diffDays < 31) {
    return `Seen ${diffDays}d ago`;
  } else if (diffMonths < 12) {
    return `Seen ${diffMonths}mth ago`;
  } else {
    return `Seen ${diffYears}y ago`;
  }
};

export const readMessages = async (
  userId: string,
  friendId: string,
  readAt: Date
) => {
  const friends = await areFriends(userId, friendId);
  if (!friends) {
    throw new Error("Not friends!");
  }

  await prisma.message.updateMany({
    data: {
      read_at: readAt,
    },
    where: {
      from_user_id: friendId,
      to_user_id: userId,
      OR: [{ read_at: null }, { read_at: { isSet: false } }],
    },
  });
};
