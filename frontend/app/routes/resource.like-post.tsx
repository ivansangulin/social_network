import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { likePost } from "~/service/post";

const actionSchema = z.object({
  liked: z.boolean(),
  postId: z.string(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const json = JSON.parse(await request.text());
    const { liked, postId } = actionSchema.parse(json);
    return await likePost(request, liked, postId);
  } catch (err) {
    console.log(err);
    return false;
  }
};
