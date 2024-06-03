import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { prisma } from "../utils/client";
import { findUserDataFromUsername } from "./UserService";

export const calculateAwayTime = (last_active: Date) => {
  const now = new Date();
  const diffYears = differenceInYears(now, last_active);
  const diffMonths = differenceInMonths(now, last_active);
  const diffDays = differenceInDays(now, last_active);
  const diffHours = differenceInHours(now, last_active);
  const diffMinutes = differenceInMinutes(now, last_active);

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}min`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 31) {
    return `${diffDays}d`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mth`;
  } else {
    return `${diffYears}y`;
  }
};

const FRIENDS_PAGING_TAKE = 20;

export const getFriends = async (
  userId: string,
  cursor: string | undefined,
  search: string | undefined | null
) => {
  const [count, friends] = await prisma.$transaction([
    prisma.friendship.count({
      where: {
        AND: [
          { OR: [{ user_id: userId }, { friend_id: userId }] },
          !!search
            ? {
                OR: [
                  {
                    friend: {
                      username: {
                        contains: `%${search.toLowerCase()}%`,
                        mode: "insensitive",
                      },
                    },
                    NOT: {
                      friend_id: userId,
                    },
                  },
                  {
                    user: {
                      username: {
                        contains: `%${search.toLowerCase()}%`,
                        mode: "insensitive",
                      },
                    },
                    NOT: {
                      user_id: userId,
                    },
                  },
                ],
              }
            : {},
        ],
      },
    }),
    prisma.friendship.findMany({
      take: FRIENDS_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        friend: {
          select: {
            username: true,
            profile_picture_uuid: true,
            id: true,
            user_status: {
              select: {
                is_online: true,
                last_seen: true,
              },
            },
          },
        },
        user: {
          select: {
            username: true,
            profile_picture_uuid: true,
            id: true,
            user_status: {
              select: {
                is_online: true,
                last_seen: true,
              },
            },
          },
        },
        id: true,
      },
      where: {
        AND: [
          { OR: [{ user_id: userId }, { friend_id: userId }] },
          !!search
            ? {
                OR: [
                  {
                    friend: {
                      username: {
                        contains: `%${search.toLowerCase()}%`,
                        mode: "insensitive",
                      },
                    },
                    NOT: {
                      friend_id: userId,
                    },
                  },
                  {
                    user: {
                      username: {
                        contains: `%${search.toLowerCase()}%`,
                        mode: "insensitive",
                      },
                    },
                    NOT: {
                      user_id: userId,
                    },
                  },
                ],
              }
            : {},
        ],
      },
      orderBy: { id: "asc" },
    }),
  ]);

  const friendsFiltered = friends.map((v) => {
    if (v.friend.id === userId) {
      v.friend = v.user;
    }
    const { ...props } = v.friend;
    return props;
  });

  const friendsPaging = {
    count,
    friends: friendsFiltered,
    cursor:
      friendsFiltered.length > 0
        ? friendsFiltered[friendsFiltered.length - 1].id
        : "",
  };
  return friendsPaging;
};

export const areFriends = async (userId: string, friendId: string) => {
  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { AND: [{ user_id: userId }, { friend_id: friendId }] },
          { AND: [{ user_id: friendId }, { friend_id: userId }] },
        ],
      },
    });
    if (!friendship) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const removeFriend = async (userId: string, friendId: string) => {
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { AND: [{ user_id: userId }, { friend_id: friendId }] },
        { AND: [{ friend_id: userId }, { user_id: friendId }] },
      ],
    },
  });
};
