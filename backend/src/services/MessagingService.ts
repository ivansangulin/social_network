import { areFriends } from "./FriendshipService";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { prisma } from "../utils/client";

const MESSAGES_PAGING_TAKE = 28;
const CHATS_PAGING_TAKE = 20;

export const createMessage = async (
  userId: string,
  chatId: string,
  message: string,
  created: Date
) => {
  const allowed = await canInteractWithChat(userId, chatId);
  if (!allowed) {
    throw new Error("Not in chat!");
  }

  const { sender: myData } = await prisma.message.create({
    select: {
      sender: {
        select: {
          id: true,
          username: true,
          profile_picture_uuid: true,
          user_status: {
            select: {
              is_online: true,
              last_seen: true,
            },
          },
        },
      },
    },
    data: {
      sender_id: userId,
      message: message,
      created: created,
      chat_id: chatId,
    },
  });

  const unreadCount = await getUnreadMessagesCount(chatId);

  return { myData, unreadCount };
};

export const getMessages = async (
  userId: string,
  chatId: string,
  cursor: string | undefined
) => {
  const allowed = await canInteractWithChat(userId, chatId);
  if (!allowed) {
    throw new Error("Not in chat!");
  }

  const [count, messages, lastMessageReadTime] = await Promise.all([
    prisma.message.count({
      where: {
        chat_id: chatId,
      },
    }),
    prisma.message.findMany({
      take: MESSAGES_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        message: true,
        sender_id: true,
        created: true,
        id: true,
      },
      where: {
        chat_id: chatId,
      },
      orderBy: { created: "desc" },
    }),
    prisma.message.findFirst({
      select: {
        sender_id: true,
        read_at: true,
      },
      where: {
        chat_id: chatId,
      },
      orderBy: { created: "desc" },
    }),
  ]);

  const messagesPaging = {
    count,
    messages,
    lastMessageReadTime:
      !!lastMessageReadTime?.read_at && lastMessageReadTime.sender_id === userId
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
  chatId: string,
  readAt: Date
) => {
  const allowed = await canInteractWithChat(userId, chatId);
  if (!allowed) {
    throw new Error("Not in chat!");
  }

  await prisma.message.updateMany({
    data: {
      read_at: readAt,
    },
    where: {
      NOT: { sender_id: userId },
      OR: [{ read_at: null }, { read_at: { isSet: false } }],
      chat_id: chatId,
    },
  });
};

const canInteractWithChat = async (userId: string, chatId: string) => {
  const chatParticipant = await prisma.chatParticipants.findFirst({
    where: {
      user_id: userId,
      chat_id: chatId,
    },
  });
  return !!chatParticipant;
};

export const getChatParticipants = async (userId: string, chatId: string) => {
  const participants = await prisma.chatParticipants.findMany({
    select: {
      user_id: true,
    },
    where: {
      chat_id: chatId,
      NOT: { user_id: userId },
    },
  });

  return participants;
};

export const getChats = async (userId: string, cursor: string | undefined) => {
  const chats = await prisma.chatParticipants.findMany({
    select: {
      chat: {
        select: {
          id: true,
        },
      },
    },
    where: {
      user_id: userId,
    },
  });
  const chatIds = chats.map((c) => c.chat.id);
  const [count, chatsData] = await Promise.all([
    prisma.message.count({
      where: {
        chat_id: {
          in: chatIds,
        },
      },
      orderBy: {
        created: "desc",
      },
    }),
    prisma.message.findMany({
      distinct: ["chat_id"],
      take: CHATS_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        sender_id: true,
        message: true,
        created: true,
        chat: {
          select: {
            id: true,
            _count: {
              select: {
                messages: {
                  where: {
                    OR: [{ read_at: null }, { read_at: { isSet: false } }],
                    NOT: { sender_id: userId },
                  },
                },
              },
            },
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profile_picture_uuid: true,
                    user_status: {
                      select: {
                        is_online: true,
                        last_seen: true,
                      },
                    },
                  },
                },
              },
              where: {
                NOT: { user_id: userId },
              },
              take: 1,
            },
          },
        },
      },
      where: {
        chat_id: {
          in: chatIds,
        },
      },
      orderBy: {
        created: "desc",
      },
    }),
  ]);

  const chatsDataMapped = chatsData.map((cd) => {
    const message = {
      message: cd.message,
      created: cd.created,
      sender_id: cd.sender_id,
      id: cd.id,
    };
    const user = cd.chat.participants[0].user;
    return {
      message,
      user,
      id: cd.chat.id,
      unreadCount: cd.chat._count.messages,
    };
  });
  return {
    count,
    chats: chatsDataMapped,
    cursor:
      chatsDataMapped.length > 0
        ? chatsDataMapped[chatsDataMapped.length - 1].message.id
        : "",
  };
};

export const getNewChat = async (userId: string, friendId: string) => {
  const friends = await areFriends(userId, friendId);
  if (!friends) {
    throw new Error("Not friends!");
  }

  const chat = await prisma.chat.findFirst({
    select: {
      id: true,
    },
    where: {
      participants: {
        every: {
          user_id: {
            in: [userId, friendId],
          },
        },
      },
    },
  });
  if (chat) {
    const chatData = await prisma.message.findFirst({
      select: {
        id: true,
        sender_id: true,
        message: true,
        created: true,
        chat: {
          select: {
            id: true,
            _count: {
              select: {
                messages: {
                  where: {
                    OR: [{ read_at: null }, { read_at: { isSet: false } }],
                    NOT: { sender_id: userId },
                  },
                },
              },
            },
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    profile_picture_uuid: true,
                    user_status: {
                      select: {
                        is_online: true,
                        last_seen: true,
                      },
                    },
                  },
                },
              },
              where: {
                NOT: { user_id: userId },
              },
              take: 1,
            },
          },
        },
      },
      where: {
        chat_id: chat.id,
      },
      orderBy: {
        created: "desc",
      },
    });
    if (chatData) {
      const message = {
        message: chatData.message,
        created: chatData.created,
        sender_id: chatData.sender_id,
        id: chatData.id,
      };
      const user = chatData.chat.participants[0].user;
      const chatDataMapped = {
        message,
        user,
        id: chat.id,
        unreadCount: chatData.chat._count.messages,
      };
      return chatDataMapped;
    } else {
      const friendData = await prisma.user.findFirstOrThrow({
        select: {
          id: true,
          username: true,
          profile_picture_uuid: true,
          user_status: {
            select: {
              is_online: true,
              last_seen: true,
            },
          },
        },
        where: {
          id: friendId,
        },
      });
      return { id: chat.id, user: friendData, unreadCount: 0 };
    }
  }
  const { chatId, friendData } = await prisma.$transaction(async (tx) => {
    const { id: chatId } = await tx.chat.create();
    await tx.chatParticipants.createMany({
      data: [
        { user_id: userId, chat_id: chatId },
        { user_id: friendId, chat_id: chatId },
      ],
    });
    const friendData = await tx.user.findFirstOrThrow({
      select: {
        id: true,
        username: true,
        profile_picture_uuid: true,
        user_status: {
          select: {
            is_online: true,
            last_seen: true,
          },
        },
      },
      where: {
        id: friendId,
      },
    });
    return { chatId, friendData };
  });
  return { id: chatId, user: friendData, unreadCount: 0 };
};

export const getUnreadMessagesCount = async (chatId: string) => {
  return await prisma.message.count({
    where: {
      chat_id: chatId,
      OR: [{ read_at: null }, { read_at: { isSet: false } }],
    },
  });
};
