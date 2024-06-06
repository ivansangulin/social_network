import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { likeComment } from "~/service/comment";

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
