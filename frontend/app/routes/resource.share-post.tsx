import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { sharePost } from "~/service/post";

const actionSchema = z.object({
  postId: z.string(),
  text: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const json = JSON.parse(await request.text());
    const { postId, text } = actionSchema.parse(json);
    return await sharePost(request, postId, text);
  } catch (err) {
    console.log(err);
    return null;
  }
};
