import { z } from "zod";
import { json } from "@remix-run/node";

export const replySchema = z
  .object({
    id: z.string(),
    text: z.string(),
    createdDescriptive: z.string(),
    parent_id: z.string().optional(),
    user: z.object({
      username: z.string(),
      profile_picture_uuid: z.string().nullish(),
    }),
    _count: z.object({
      likes: z.number(),
    }),
    likes: z.array(
      z.object({
        id: z.string(),
      })
    ),
  })
  .transform(({ likes, ...props }) => ({
    liked: likes.length > 0,
    ...props,
  }));

export const commentSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    createdDescriptive: z.string(),
    parent_id: z.string().optional(),
    user: z.object({
      username: z.string(),
      profile_picture_uuid: z.string().nullish(),
    }),
    _count: z.object({
      likes: z.number(),
      replies: z.number().nullish(),
    }),
    likes: z.array(
      z.object({
        id: z.string(),
      })
    ),
    replies: z.array(replySchema).nullish(),
  })
  .transform(({ likes, ...props }) => ({
    liked: likes.length > 0,
    ...props,
  }));

const postSchema = z.object({
  id: z.string(),
  parent_id: z.string().nullish(),
  createdLocalDate: z.string(),
  text: z.string(),
  photos: z.array(z.string()).nullish(),
  _count: z.object({
    likes: z.number(),
    comments: z.number(),
  }),
  user: z.object({
    username: z.string(),
    profile_picture_uuid: z.string().nullish(),
  }),
  parent: z
    .object({
      user: z.object({
        username: z.string(),
        profile_picture_uuid: z.string().nullish(),
      }),
      text: z.string(),
      createdLocalDate: z.string(),
      photos: z.array(z.string()).nullish(),
    })
    .nullish(),
  liked: z.boolean(),
  comments: z.array(commentSchema).nullish(),
  parentCommentCount: z.number().nullish(),
});

const postPagingSchema = z.object({
  count: z.number(),
  cursor: z.string(),
  posts: z.array(postSchema),
});

export type Post = z.infer<typeof postSchema>;
export type PostPaging = z.infer<typeof postPagingSchema>;
export type CommentType = z.infer<typeof commentSchema>;
export type Reply = z.infer<typeof replySchema>;

export const getMainPagePosts = async (
  cookie: string,
  cursor: string | null
) => {
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
  cookie: string,
  username: string,
  cursor: string | null
) => {
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
  cookie: string,
  liked: boolean,
  postId: string
) => {
  try {
    const likeResponse = await fetch(`${process.env.BACKEND_URL}/post/like`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ liked, postId }),
    });
    return likeResponse.ok;
  } catch (err) {
    console.log(err);
    return true;
  }
};

export const getPost = async (cookie: string, postId: string) => {
  try {
    const postResponse = await fetch(
      `${process.env.BACKEND_URL}/post?postId=${postId}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!postResponse.ok) {
      return null;
    }
    const post = await postSchema.parse(await postResponse.json());
    return post;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const sharePost = async (
  cookie: string,
  postId: string,
  text: string | undefined
) => {
  try {
    const shareResponse = await fetch(`${process.env.BACKEND_URL}/post/share`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId, text }),
    });
    if (!shareResponse.ok) {
      return null;
    }
    const post = postSchema.parse(await shareResponse.json());
    return post;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const deletePost = async (cookie: string, postId: string) => {
  try {
    const deletePostResponse = await fetch(
      `${process.env.BACKEND_URL}/post/delete`,
      {
        method: "DELETE",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      }
    );
    if (!deletePostResponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const editPost = async (
  cookie: string,
  postId: string,
  text: string
) => {
  try {
    const editPostReponse = await fetch(
      `${process.env.BACKEND_URL}/post/edit`,
      {
        method: "PATCH",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, text }),
      }
    );
    if (!editPostReponse.ok) {
      return false;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const createNewPost = async (cookie: string, data: FormData) => {
  try {
    const newPostResponse = await fetch(
      `${process.env.BACKEND_URL}/post/create`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
        },
        body: data,
      }
    );
    if (!newPostResponse.ok) {
      console.log(newPostResponse);
      return json({ error: "Failed to create new post!", post: null });
    }
    const post = postSchema.parse(await newPostResponse.json());
    return { post, error: null };
  } catch (err) {
    console.log(err);
    return json({ error: "Failed to create new post!", post: null });
  }
};
