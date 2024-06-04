import { io } from "../app";
import { prisma } from "../utils/client";
import { areFriends } from "./FriendshipService";
import { createNotification } from "./NotificationService";

export const sendFriendRequest = async (
  userId: string,
  friendId: string,
  created: Date
) => {
  const [exists, friendShipExists] = await Promise.all([
    isFriendRequestPending(userId, friendId),
    areFriends(userId, friendId),
  ]);
  if (exists || friendShipExists) {
    throw new Error("Friend request/Friendship exists!");
  }

  const {
    fromUser: { username, profile_picture_uuid },
  } = await prisma.friendRequest.create({
    select: {
      toUser: {
        select: {
          id: true,
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
      to_user_id: friendId,
      created: created,
    },
  });
  io.to(friendId).emit("newFriendRequest", {
    id: userId,
    username,
    profile_picture_uuid,
  });
};

export const acceptFriendRequest = async (userId: string, friendId: string) => {
  const friendRequest = await isFriendRequestPending(userId, friendId);
  if (!friendRequest) {
    throw new Error("No such friend request!");
  } else if (friendRequest.to_user_id !== userId) {
    throw new Error("Not my request!");
  }
  const {
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
        user: {
          select: {
            username: true,
          },
        },
      },
    });
  });

  await createNotification(
    friendId,
    undefined,
    `has accepted your friend request!`,
    userId
  );
};

export const declineFriendRequest = async (
  userId: string,
  friendId: string
) => {
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

  if (senderId === userId) {
    io.to(friendId).emit("canceledRequest", {
      friendUsername: senderUsername,
    });
  }
};

export const isFriendRequestPending = async (
  userId: string,
  friendId: string
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
        { OR: [{ accepted: null }, { accepted: { isSet: false } }] },
      ],
    },
  });
  return friendRequest;
};

export const getMyPendingFriendRequests = async (userId: string) => {
  const [friendRequests, unreadCount] = await Promise.all([
    prisma.friendRequest.findMany({
      select: {
        fromUser: {
          select: {
            id: true,
            username: true,
            profile_picture_uuid: true,
          },
        },
        read: true,
      },
      where: {
        to_user_id: userId,
        OR: [{ accepted: null }, { accepted: { isSet: false } }],
      },
      orderBy: { created: "desc" },
    }),
    prisma.friendRequest.count({
      where: {
        to_user_id: userId,
        OR: [{ accepted: null }, { accepted: { isSet: false } }],
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

export const readFriendRequests = async (userId: string) => {
  await prisma.friendRequest.updateMany({
    data: {
      read: true,
    },
    where: {
      to_user_id: userId,
      read: false,
      OR: [{ accepted: null }, { accepted: { isSet: false } }],
    },
  });
};
