import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FRIENDS_PAGING_TAKE = 20;

export const getFriends = async (
  userId: number,
  cursor: number | undefined,
  search: string | undefined | null
) => {
  //make a materialized view?
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
            uuid: true,
            profile_picture_uuid: true,
            id: true,
          },
        },
        user: {
          select: {
            username: true,
            uuid: true,
            profile_picture_uuid: true,
            id: true,
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
      const { user, ...props } = v;
      return props;
    } else {
      const { user, ...props } = v;
      return props;
    }
  });

  const friendsPaging = {
    count,
    friends: friendsFiltered,
    cursor:
      friendsFiltered.length > 0
        ? friendsFiltered[friendsFiltered.length - 1].id
        : 0,
  };
  return friendsPaging;
};

export const areFriends = async (userId: number, friendId: number) => {
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
    return false;
  }
};

export const getFriendsUuids = async (userId: number, userUuid: string) => {
  const friendshipUuids = await prisma.friendship.findMany({
    select: {
      friend: {
        select: {
          uuid: true,
        },
      },
      user: {
        select: {
          uuid: true,
        },
      },
    },
    where: { OR: [{ user_id: userId }, { friend_id: userId }] },
  });

  const friendsUuids = friendshipUuids.map((f) =>
    f.user.uuid === userUuid ? f.friend.uuid : f.user.uuid
  );

  return friendsUuids;
};
