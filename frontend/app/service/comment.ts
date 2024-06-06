import { z } from "zod";
import { getCookie } from "./user";

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
