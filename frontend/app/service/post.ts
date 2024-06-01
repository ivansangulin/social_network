import { z } from "zod";
import { getCookie } from "./user";

const postSchema = z.object({
  id: z.number(),
  createdLocalDate: z.string(),
  text: z.string(),
  _count: z.object({
    likes: z.number(),
    comments: z.number(),
  }),
  user: z.object({
    username: z.string(),
    profile_picture_uuid: z.string(),
  }),
  liked: z.boolean(),
});

const postPagingSchema = z.object({
  count: z.number(),
  cursor: z.number(),
  posts: z.array(postSchema),
});

export type Post = z.infer<typeof postSchema>;
export type PostPaging = z.infer<typeof postPagingSchema>;

export const getMyPosts = async (request: Request, cursor: string | null) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const userPostsResponse = await fetch(
      `${process.env.BACKEND_URL}/post/my-posts?cursor=${cursor ?? ""}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!userPostsResponse.ok) {
      return null;
    }
    const userPostsPaging = await postPagingSchema.parse(
      await userPostsResponse.json()
    );
    return userPostsPaging;
  } catch (err) {
    return null;
  }
};

export const getMainPagePosts = async (
  request: Request,
  cursor: string | null
) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const postsResponse = await fetch(
      `${process.env.BACKEND_URL}/post/main-page-posts?cursor=${cursor ?? ""}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!postsResponse.ok) {
      return null;
    }
    const posts = await postPagingSchema.parse(await postsResponse.json());
    return posts;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getUserPosts = async (
  request: Request,
  username: string,
  cursor: string | null
) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const postsResponse = await fetch(
      `${process.env.BACKEND_URL}/post/user-posts?username=${username}&cursor=${
        cursor ?? ""
      }`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!postsResponse.ok) {
      return null;
    }
    const userPosts = postPagingSchema.parse(await postsResponse.json());
    return userPosts;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const likePost = async (
  request: Request,
  liked: boolean,
  postId: number
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
    const likeResponse = await fetch(`${process.env.BACKEND_URL}/post/like`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ liked, postId }),
    });
    if (!likeResponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return true;
  }
};
