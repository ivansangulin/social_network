import { prisma } from "../utils/client";
import { areFriends } from "./FriendshipService";
import { createNotification } from "./NotificationService";

export const createComment = async (
  userId: string,
  postId: string,
  text: string,
  commentId?: string
) => {
  var parentId: string | undefined;
  var commentCreatorId;
  if (commentId) {
    const {
      parent_id,
      user: { id: comment_creator_id },
    } = await prisma.comment.findUniqueOrThrow({
      select: {
        parent_id: true,
        user: {
          select: {
            id: true,
          },
        },
      },
      where: {
        id: commentId,
      },
    });
    parentId = parent_id ?? commentId;
    commentCreatorId = comment_creator_id;
  }
  const {
    post: { user_id: post_creator_id },
    id,
  } = await prisma.comment.create({
    data: {
      user_id: userId,
      post_id: postId,
      text: text,
      parent_id: parentId,
    },
    select: {
      post: {
        select: {
          user_id: true,
        },
      },
      id: true,
    },
  });
  if (commentCreatorId && commentCreatorId !== userId) {
    await createNotification(
      commentCreatorId,
      postId,
      `has replied to your comment!`,
      userId
    );
  }
  if (
    userId !== post_creator_id && commentCreatorId
      ? commentCreatorId !== post_creator_id
      : true
  ) {
    await createNotification(
      post_creator_id,
      postId,
      `has commented on your post!`,
      userId
    );
  }
  return id;
};

export const likeComment = async (userId: string, commentId: string) => {
  const {
    comment: {
      post: { id: post_id },
      user: { id: comment_creator_id },
    },
  } = await prisma.commentLike.create({
    select: {
      comment: {
        select: {
          post: {
            select: {
              id: true,
            },
          },
          user: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    data: {
      comment_id: commentId,
      user_id: userId,
    },
  });
  if (comment_creator_id !== userId) {
    await createNotification(
      comment_creator_id,
      post_id,
      `has liked your comment!`,
      userId
    );
  }
};

export const dislikeComment = async (userId: string, commentId: string) => {
  await prisma.commentLike.deleteMany({
    where: {
      user_id: userId,
      comment_id: commentId,
    },
  });
};

export const canInteractWithComment = async (
  userId: string,
  commentId: string
) => {
  const {
    post: { user: postCreator },
  } = await prisma.comment.findFirstOrThrow({
    select: {
      post: {
        select: {
          user: true,
        },
      },
    },
    where: {
      id: commentId,
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
