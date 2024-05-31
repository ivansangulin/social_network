import { z } from "zod";
import { getCookie } from "./user";

const friendRequestSchema = z.object({
  read: z.boolean(),
  user: z.object({
    username: z.string(),
    profile_picture_uuid: z.string().nullish(),
  }),
});

const pendingRequestsSchema = z.object({
  friendRequests: z.array(friendRequestSchema),
  unreadFriendRequestCount: z.number(),
});

export type PendingRequests = z.infer<typeof pendingRequestsSchema>;
export type FriendRequest = z.infer<typeof friendRequestSchema>;

export const getPendingFriendRequests = async (request: Request) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return null;
    }
    const friendRequestsResponse = await fetch(
      `${process.env.BACKEND_URL}/friendship/friend-requests`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    const pendingRequests = pendingRequestsSchema.parse(
      await friendRequestsResponse.json()
    );
    return pendingRequests;
  } catch (err) {
    console.log(err);
    return null;
  }
};
