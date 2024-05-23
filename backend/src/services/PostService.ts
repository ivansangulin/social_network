import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({
  result: {
    post: {
      createdLocalDate: {
        needs: { created: true },
        compute(data) {
          return data.created.toLocaleDateString();
        },
      },
    },
  },
});

const POST_PAGING_TAKE = 8;

export const getUserPosts = async (
  userId: number,
  cursor: number | undefined
) => {
  const [count, posts] = await Promise.all([
    prisma.post.count({ where: { user_id: userId } }),
    prisma.post.findMany({
      take: POST_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        createdLocalDate: true,
        text: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        user: {
          select: {
            profile_picture_uuid: true,
            username: true,
          },
        },
      },
      where: {
        user_id: userId,
      },
    }),
  ]);

  const userPostPaging = {
    count,
    posts,
    cursor: posts.length > 0 ? posts[posts.length - 1].id : 0,
  };

  return userPostPaging;
};

export const createPost = async (userId: number, text: string) => {
  const post = await prisma.post.create({
    data: {
      user_id: userId,
      text: text,
    },
    select: {
      id: true,
      createdLocalDate: true,
      text: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      user: {
        select: {
          profile_picture_uuid: true,
          username: true,
        },
      },
    },
  });
  return post;
};

export const getMainPagePosts = async (
  userId: number,
  cursor: number | undefined
) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ user_id: userId }, { friend_id: userId }],
    },
  });
  const friendIds = friendships.map((f) =>
    f.user_id === userId ? f.friend_id : f.user_id
  );
  friendIds.push(userId);
  const [count, posts] = await Promise.all([
    prisma.post.count({
      where: {
        user_id: {
          in: friendIds,
        },
      },
    }),
    prisma.post.findMany({
      take: POST_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        user_id: {
          in: friendIds,
        },
      },
      select: {
        id: true,
        createdLocalDate: true,
        text: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        user: {
          select: {
            profile_picture_uuid: true,
            username: true,
          },
        },
      },
      orderBy: {
        created: "desc",
      },
    }),
  ]);
  const userPostPaging = {
    count,
    posts,
    cursor: posts.length > 0 ? posts[posts.length - 1].id : 0,
  };

  return userPostPaging;
};
