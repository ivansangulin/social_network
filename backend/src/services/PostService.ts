import { prisma } from "../utils/client";
import { areFriends } from "./FriendshipService";
import { createNotification } from "./NotificationService";

const POST_PAGING_TAKE = 8;
const INITIAL_COMMENT_NUMBER = 3;

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
        comments: {
          select: {
            id: true,
            text: true,
            createdDescriptive: true,
            user: {
              select: {
                username: true,
                profile_picture_uuid: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
            likes: {
              select: {
                id: true,
              },
              where: {
                user_id: userId,
              },
            },
            replies: {
              select: {
                id: true,
                text: true,
                createdDescriptive: true,
                parent_id: true,
                user: {
                  select: {
                    username: true,
                    profile_picture_uuid: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                  },
                },
                likes: {
                  select: {
                    id: true,
                  },
                  where: {
                    user_id: userId,
                  },
                },
              },
              orderBy: { created: "asc" },
            },
          },
          where: {
            OR: [{ parent_id: null }, { parent_id: { isSet: false } }],
          },
          take: INITIAL_COMMENT_NUMBER,
        },
      },
      where: {
        user_id: userId,
      },
      orderBy: { created: "desc" },
    }),
  ]);

  const mappedPosts = posts.map((post) => {
    const commentsMapped = post.comments.map((c) => {
      const { likes, ...props } = c;
      return { liked: likes.length > 0, ...props };
    });
    const { likes, comments, ...props } = post;
    return { liked: likes.length > 0, comments: commentsMapped, ...props };
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
      comments: {
        select: {
          id: true,
          text: true,
          createdDescriptive: true,
          user: {
            select: {
              username: true,
              profile_picture_uuid: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          likes: {
            select: {
              id: true,
            },
            where: {
              user_id: userId,
            },
          },
          replies: {
            select: {
              id: true,
              text: true,
              createdDescriptive: true,
              parent_id: true,
              user: {
                select: {
                  username: true,
                  profile_picture_uuid: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
              likes: {
                select: {
                  id: true,
                },
                where: {
                  user_id: userId,
                },
              },
            },
            orderBy: { created: "asc" },
          },
        },
        where: {
          OR: [{ parent_id: null }, { parent_id: { isSet: false } }],
        },
        take: INITIAL_COMMENT_NUMBER,
        orderBy: { created: "desc" },
      },
    },
  });
  const commentsMapped = post.comments.map((c) => {
    const { likes, ...props } = c;
    return { liked: likes.length > 0, ...props };
  });
  const { likes, comments, ...props } = post;
  return {
    post: { liked: likes.length > 0, comments: commentsMapped, ...props },
  };
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
        comments: {
          select: {
            id: true,
            text: true,
            createdDescriptive: true,
            user: {
              select: {
                username: true,
                profile_picture_uuid: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
            likes: {
              select: {
                id: true,
              },
              where: {
                user_id: userId,
              },
            },
            replies: {
              select: {
                id: true,
                text: true,
                createdDescriptive: true,
                parent_id: true,
                user: {
                  select: {
                    username: true,
                    profile_picture_uuid: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                  },
                },
                likes: {
                  select: {
                    id: true,
                  },
                  where: {
                    user_id: userId,
                  },
                },
              },
              orderBy: { created: "asc" },
            },
          },
          where: {
            OR: [{ parent_id: null }, { parent_id: { isSet: false } }],
          },
          take: INITIAL_COMMENT_NUMBER,
          orderBy: { created: "desc" },
        },
      },
      orderBy: {
        created: "desc",
      },
    }),
  ]);

  const mappedPosts = posts.map((post) => {
    const commentsMapped = post.comments.map((c) => {
      const { likes, ...props } = c;
      return { liked: likes.length > 0, ...props };
    });
    const { likes, comments, ...props } = post;
    return { liked: likes.length > 0, comments: commentsMapped, ...props };
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
  } = await prisma.postLike.create({
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
  await prisma.postLike.deleteMany({
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
      comments: {
        select: {
          id: true,
          text: true,
          createdDescriptive: true,
          user: {
            select: {
              username: true,
              profile_picture_uuid: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          likes: {
            select: {
              id: true,
            },
            where: {
              user_id: userId,
            },
          },
          replies: {
            select: {
              id: true,
              text: true,
              createdDescriptive: true,
              parent_id: true,
              user: {
                select: {
                  username: true,
                  profile_picture_uuid: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
              likes: {
                select: {
                  id: true,
                },
                where: {
                  user_id: userId,
                },
              },
            },
            orderBy: { created: "asc" },
          },
        },
        where: {
          OR: [{ parent_id: null }, { parent_id: { isSet: false } }],
        },
        take: INITIAL_COMMENT_NUMBER,
      },
    },
    where: {
      id: postId,
    },
  });

  const commentsMapped = post.comments.map((c) => {
    const { likes, ...props } = c;
    return { liked: likes.length > 0, ...props };
  });
  const { likes, comments, ...props } = post;
  return { liked: likes.length > 0, comments: commentsMapped, ...props };
};

export const canInteractWithPost = async (userId: string, postId: string) => {
  const { user: postCreator } = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
    select: {
      user: true,
    },
  });
  if (
    !postCreator.locked_profile ||
    (await areFriends(userId, postCreator.id)) ||
    postCreator.id === userId
  ) {
    return true;
  }
  return false;
};
