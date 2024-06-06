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
  if (commentId) {
    const { parent_id } = await prisma.comment.findUniqueOrThrow({
      select: {
        parent_id: true,
      },
      where: {
        id: commentId,
      },
    });
    parentId = parent_id ?? commentId;
  }
  const {
    post: { user_id: friendId },
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
  if (userId !== friendId) {
    await createNotification(
      friendId,
      postId,
      `has commented on your post!`,
      userId
    );
  }
  return id;
};

export const likeComment = async (userId: string, commentId: string) => {
  await prisma.commentLike.create({
    data: {
      comment_id: commentId,
      user_id: userId,
    },
  });
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
