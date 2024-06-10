import { z } from "zod";
import { getCookie } from "./user";
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
  request: Request,
  text: string,
  postId: string,
  commentId?: string
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return null;
    }
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
  request: Request,
  commentId: string,
  liked: boolean
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
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
    if (!likeResponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const getComments = async (
  request: Request,
  postId: string,
  cursor?: string
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
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
  request: Request,
  commentId: string,
  cursor?: string
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
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
