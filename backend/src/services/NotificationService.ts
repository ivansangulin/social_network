import { subMinutes, subWeeks } from "date-fns";
import { prisma } from "../utils/client";
import { io } from "../app";

export const createNotification = async (
  userId: string,
  postId: string | undefined,
  message: string,
  senderId: string
) => {
  if (postId && (message.includes("like") || message.includes("comment"))) {
    const lastFiveMinutes = subMinutes(new Date(), 5);
    const prevNotification = await prisma.notification.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
        message: message,
        sender_id: senderId,
        created: {
          gte: lastFiveMinutes,
        },
      },
    });
    if (prevNotification) {
      return;
    }
  }
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      post_id: postId,
      message: message,
      sender_id: senderId,
    },
    select: {
      id: true,
      createdDescriptive: true,
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
  io.to(userId).emit("notification", { notification });
};

export const findMyNotifications = async (userId: string) => {
  const lastWeek = subWeeks(new Date(), 1);
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      select: {
        id: true,
        createdDescriptive: true,
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

export const readNotifications = async (userId: string) => {
  await prisma.notification.updateMany({
    where: {
      user_id: userId,
    },
    data: {
      read: true,
    },
  });
};
