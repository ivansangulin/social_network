import { z } from "zod";
import { getCookie } from "./user";

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

export const getPendingFriendRequests = async (request: Request) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return null;
    }
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

export const addFriend = async (request: Request, friendId: string) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
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
      console.log(addFriendResponse);
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const removeFriend = async (request: Request, friendId: string) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
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
  request: Request,
  friendId: string,
  accepted: boolean
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
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
      console.log(handleFriendRequestResponse);
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
