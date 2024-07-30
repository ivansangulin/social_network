import { z } from "zod";
import { commentSchema, replySchema } from "./post";

const commentsPagingSchema = z.object({
  count: z.number(),
  comments: z.array(commentSchema),
  cursor: z.string(),
});

const repliesPagingSchema = z.object({
  count: z.number(),
  replies: z.array(replySchema),
  cursor: z.string(),
});

export type CommentsPaging = z.infer<typeof commentsPagingSchema>;
export type RepliesPaging = z.infer<typeof repliesPagingSchema>;

export const commentOnPost = async (
  cookie: string,
  text: string,
  postId: string,
  commentId?: string
) => {
  try {
    const commentResponse = await fetch(`${process.env.BACKEND_URL}/comment`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, postId, commentId }),
    });
    if (!commentResponse.ok) {
      return null;
    }
    const id = await z.string().parse(await commentResponse.json());
    return id;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const likeComment = async (
  cookie: string,
  commentId: string,
  liked: boolean
) => {
  try {
    const likeResponse = await fetch(
      `${process.env.BACKEND_URL}/comment/like`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId, liked }),
      }
    );
    return likeResponse.ok;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const getComments = async (
  cookie: string,
  postId: string,
  cursor?: string
) => {
  try {
    const commentsResponse = await fetch(
      `${process.env.BACKEND_URL}/comment?postId=${postId}&cursor=${
        cursor ?? ""
      }`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!commentsResponse.ok) {
      return null;
    }
    const comments = commentsPagingSchema.parse(await commentsResponse.json());
    return comments;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getReplies = async (
  cookie: string,
  commentId: string,
  cursor?: string
) => {
  try {
    const repliesResponse = await fetch(
      `${
        process.env.BACKEND_URL
      }/comment/replies?commentId=${commentId}&cursor=${cursor ?? ""}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!repliesResponse.ok) {
      return null;
    }
    const replies = repliesPagingSchema.parse(await repliesResponse.json());
    return replies;
  } catch (err) {
    console.log(err);
    return null;
  }
};
