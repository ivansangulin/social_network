import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { likePost } from "~/service/post";

const actionSchema = z.object({
  liked: z.boolean(),
  postId: z.number(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const json = await JSON.parse(await request.text());
    const { liked, postId } = await actionSchema.parse(json);
    return await likePost(request, liked, postId);
  } catch (err) {
    console.log(err);
    return false;
  }
};
