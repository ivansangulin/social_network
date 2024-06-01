import { prisma } from "../utils/client";
import { areFriends } from "./FriendshipService";
import { findUserDataFromUsername } from "./UserService";

export const sendFriendRequest = async (
  userId: number,
  friendUsername: string,
  created: Date
) => {
  const toUserData = await findUserDataFromUsername(friendUsername);
  if (!toUserData) {
    throw new Error("No such user");
  }
  const { id: toUserId } = toUserData;

  const [exists, friendShipExists] = await Promise.all([
    isFriendRequestPending(userId, toUserId),
    areFriends(userId, toUserId),
  ]);
  if (exists || friendShipExists) {
    throw new Error("Friend request/Friendship exists!");
  }

  const {
    toUser: { uuid: toUserUuid },
    fromUser: { username, profile_picture_uuid },
  } = await prisma.friendRequest.create({
    select: {
      toUser: {
        select: {
          uuid: true,
        },
      },
      fromUser: {
        select: {
          username: true,
          profile_picture_uuid: true,
        },
      },
    },
    data: {
      from_user_id: userId,
      to_user_id: toUserId,
      created: created,
    },
  });

  return { toUserUuid, username, profile_picture_uuid };
};

export const acceptFriendRequest = async (
  userId: number,
  friendUsername: string
) => {
  const friendData = await findUserDataFromUsername(friendUsername);
  if (!friendData) {
    throw new Error("No such user");
  }
  const { id: friendId } = friendData;
  const friendRequest = await isFriendRequestPending(userId, friendId);
  if (!friendRequest) {
    throw new Error("No such friend request!");
  } else if (friendRequest.to_user_id !== userId) {
    throw new Error("Not my request!");
  }
  const {
    friend: { uuid: friendUuid },
    user: { username },
  } = await prisma.$transaction(async (prismaTx) => {
    const { from_user_id: friendId } = await prismaTx.friendRequest.update({
      data: {
        accepted: true,
      },
      where: {
        id: friendRequest.id,
      },
    });
    return await prismaTx.friendship.create({
      data: {
        user_id: userId,
        friend_id: friendId,
      },
      select: {
        friend: {
          select: {
            uuid: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });
  });

  return { friendUuid, username };
};

export const declineFriendRequest = async (
  userId: number,
  friendUsername: string
) => {
  const friendData = await findUserDataFromUsername(friendUsername);
  if (!friendData) {
    throw new Error("No such user");
  }
  const { id: friendId } = friendData;
  const friendRequest = await isFriendRequestPending(userId, friendId);
  if (!friendRequest) {
    throw new Error("No such friend request!");
  }
  const {
    from_user_id: senderId,
    fromUser: { username: senderUsername },
  } = await prisma.friendRequest.update({
    select: {
      from_user_id: true,
      fromUser: {
        select: {
          username: true,
        },
      },
    },
    data: {
      accepted: false,
    },
    where: {
      id: friendRequest.id,
    },
  });

  return { senderId, senderUsername };
};

export const isFriendRequestPending = async (
  userId: number,
  friendId: number
) => {
  const friendRequest = await prisma.friendRequest.findFirst({
    where: {
      AND: [
        {
          OR: [
            { AND: [{ from_user_id: userId }, { to_user_id: friendId }] },
            { AND: [{ to_user_id: userId }, { from_user_id: friendId }] },
          ],
        },
        { accepted: null },
      ],
    },
  });
  return friendRequest;
};

export const getMyPendingFriendRequests = async (userId: number) => {
  const [friendRequests, unreadCount] = await Promise.all([
    prisma.friendRequest.findMany({
      select: {
        fromUser: {
          select: {
            username: true,
            profile_picture_uuid: true,
          },
        },
        read: true,
      },
      where: {
        to_user_id: userId,
        accepted: null,
      },
      orderBy: { created: "desc" },
    }),
    prisma.friendRequest.count({
      where: {
        to_user_id: userId,
        accepted: null,
        read: false,
      },
    }),
  ]);
  const friendRequestsMapped = friendRequests.map((fr) => {
    return { read: fr.read, user: fr.fromUser };
  });

  return {
    friendRequests: friendRequestsMapped,
    unreadFriendRequestCount: unreadCount,
  };
};

export const readFriendRequests = async (userId: number) => {
  await prisma.friendRequest.updateMany({
    data: {
      read: true,
    },
    where: {
      to_user_id: userId,
      read: false,
      accepted: null,
    },
  });
};
