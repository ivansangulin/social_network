import { z } from "zod";

const friendRequestSchema = z.object({
  read: z.boolean(),
  user: z.object({
    id: z.string(),
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

export const getPendingFriendRequests = async (cookie: string) => {
  try {
    const friendRequestsResponse = await fetch(
      `${process.env.BACKEND_URL}/friend-request`,
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

export const addFriend = async (cookie: string, friendId: string) => {
  try {
    const addFriendResponse = await fetch(
      `${process.env.BACKEND_URL}/friend-request/add`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      }
    );
    if (!addFriendResponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const removeFriend = async (cookie: string, friendId: string) => {
  try {
    const removeFriendResponse = await fetch(
      `${process.env.BACKEND_URL}/friend-request/remove`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      }
    );
    if (!removeFriendResponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const handleFriendRequest = async (
  cookie: string,
  friendId: string,
  accepted: boolean
) => {
  try {
    const handleFriendRequestResponse = await fetch(
      `${process.env.BACKEND_URL}/friend-request/handle`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId, accepted }),
      }
    );
    if (!handleFriendRequestResponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
