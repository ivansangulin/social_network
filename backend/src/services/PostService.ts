import { prisma } from "../utils/client";
import { createNotification } from "./NotificationService";

const POST_PAGING_TAKE = 8;

export const getUserPosts = async (
  userId: string,
  cursor: string | undefined
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
        likes: {
          where: {
            user_id: userId,
          },
          select: {
            id: true,
          },
        },
      },
      where: {
        user_id: userId,
      },
      orderBy: { created: "desc" },
    }),
  ]);

  const mappedPosts = posts.map((post) => {
    const { likes, ...props } = post;
    return { liked: likes.length > 0, ...props };
  });

  const userPostPaging = {
    count,
    posts: mappedPosts,
    cursor: posts.length > 0 ? posts[posts.length - 1].id : "",
  };

  return userPostPaging;
};

export const createPost = async (userId: string, text: string) => {
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
      likes: {
        where: {
          user_id: userId,
        },
        select: {
          id: true,
        },
      },
    },
  });
  const { likes, ...props } = post;
  return { post: { liked: likes.length > 0, ...props } };
};

export const getMainPagePosts = async (
  userId: string,
  cursor: string | undefined
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
        likes: {
          where: {
            user_id: userId,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        created: "desc",
      },
    }),
  ]);

  const mappedPosts = posts.map((post) => {
    const { likes, ...props } = post;
    return { liked: likes.length > 0, ...props };
  });

  const userPostPaging = {
    count,
    posts: mappedPosts,
    cursor: posts.length > 0 ? posts[posts.length - 1].id : "",
  };

  return userPostPaging;
};

export const likePost = async (userId: string, postId: string) => {
  const {
    post: { user_id: friendId },
  } = await prisma.like.create({
    data: {
      post_id: postId,
      user_id: userId,
    },
    select: {
      post: {
        select: {
          user_id: true,
        },
      },
    },
  });
  if (userId !== friendId) {
    await createNotification(friendId, postId, `has liked your post!`, userId);
  }
};

export const dislikePost = async (userId: string, postId: string) => {
  await prisma.like.deleteMany({
    where: {
      post_id: postId,
      user_id: userId,
    },
  });
};

export const getPost = async (userId: string, postId: string) => {
  const post = await prisma.post.findUniqueOrThrow({
    select: {
      id: true,
      createdLocalDate: true,
      text: true,
      user_id: true,
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
          locked_profile: true,
        },
      },
      likes: {
        where: {
          user_id: userId,
        },
        select: {
          id: true,
        },
      },
    },
    where: {
      id: postId,
    },
  });

  const { likes, ...props } = post;
  return { liked: likes.length > 0, ...props };
};
