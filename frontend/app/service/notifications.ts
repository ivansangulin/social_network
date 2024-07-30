import { z } from "zod";

const notificationSchema = z.object({
  id: z.string(),
  message: z.string(),
  createdDescriptive: z.string(),
  post_id: z.string().nullish(),
  read: z.boolean(),
  sender: z.object({
    username: z.string(),
    profile_picture_uuid: z.string().nullish(),
  }),
});

const notificationDataSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
});

export type NotificationType = z.infer<typeof notificationSchema>;
export type NotificationData = z.infer<typeof notificationDataSchema>;

export const findMyNotifications = async (cookie: string) => {
  try {
    const notificationsResponse = await fetch(
      `${process.env.BACKEND_URL}/notification/my-notifications`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!notificationsResponse.ok) {
      return null;
    }
    const notifications = await notificationDataSchema.parse(
      await notificationsResponse.json()
    );
    return notifications;
  } catch (err) {
    console.log(err);
    return null;
  }
};
