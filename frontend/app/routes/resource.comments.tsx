import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { getComments, getReplies, likeComment } from "~/service/comment";

const actionSchema = z.object({
  commentId: z.string(),
  liked: z.boolean(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const json = await JSON.parse(await request.text());
    const { commentId, liked } = await actionSchema.parse(json);
    return await likeComment(request, commentId, liked);
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
    const params = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );
    const { entities, parentEntityId, cursor } = loaderSchema.parse(params);
    if (entities === "comments") {
      return await getComments(request, parentEntityId, cursor);
    } else {
      return await getReplies(request, parentEntityId, cursor);
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};
