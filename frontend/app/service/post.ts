import { z } from "zod";
import { getCookie } from "./user";

const postSchema = z.object({
  id: z.number(),
  created: z.string().transform((val) => new Date(val).toLocaleDateString()),
  text: z.string(),
  _count: z.object({
    likes: z.number(),
    comments: z.number(),
  }),
});

const postPagingSchema = z.object({
  count: z.number(),
  cursor: z.number(),
  posts: z.array(postSchema),
});

export type Post = z.infer<typeof postSchema>;
export type PostPaging = z.infer<typeof postPagingSchema>;

export const getUserPosts = async (request: Request, cursor: string | null) => {
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
