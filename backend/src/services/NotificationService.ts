import { subWeeks } from "date-fns";
import { prisma } from "../utils/client";

export const createNotification = async (
  userId: number,
  postId: number,
  message: string,
  senderId: number
) => {
  //TODO debounce
  return await prisma.notification.create({
    data: {
      user_id: userId,
      post_id: postId,
      message: message,
      sender_id: senderId,
    },
    select: {
      id: true,
      created: true,
      message: true,
      post_id: true,
      read: true,
      sender: {
        select: {
          username: true,
          profile_picture_uuid: true,
        },
      },
    },
  });
};

export const findMyNotifications = async (userId: number) => {
  const lastWeek = subWeeks(new Date(), 1);
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      select: {
        id: true,
        created: true,
        message: true,
        post_id: true,
        read: true,
        sender: {
          select: {
            username: true,
            profile_picture_uuid: true,
          },
        },
      },
      where: {
        created: {
          gte: lastWeek,
        },
        user_id: userId,
      },
      orderBy: { created: "desc" },
    }),
    prisma.notification.count({
      where: {
        created: {
          gte: lastWeek,
        },
        user_id: userId,
        read: false,
      },
    }),
  ]);
  return { notifications, unreadCount };
};

export const readNotifications = async (userId: number) => {
  await prisma.notification.updateMany({
    where: {
      user_id: userId,
    },
    data: {
      read: true,
    },
  });
};
