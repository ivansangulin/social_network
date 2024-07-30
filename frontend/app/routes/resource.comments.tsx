import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { z } from "zod";
import { getComments, getReplies, likeComment } from "~/service/comment";
import { getCookie } from "~/service/user";

const actionSchema = z.object({
  commentId: z.string(),
  liked: z.boolean(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const json = await JSON.parse(await request.text());
    const { commentId, liked } = await actionSchema.parse(json);
    return await likeComment(cookie, commentId, liked);
  } catch (err) {
    console.log(err);
    return false;
  }
};

const loaderSchema = z.object({
  entities: z.enum(["comments", "replies"]),
  parentEntityId: z.string(),
  cursor: z.string().optional(),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const params = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );
    const { entities, parentEntityId, cursor } = loaderSchema.parse(params);
    if (entities === "comments") {
      return await getComments(cookie, parentEntityId, cursor);
    } else {
      return await getReplies(cookie, parentEntityId, cursor);
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};
