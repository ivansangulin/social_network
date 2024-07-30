import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { commentOnPost } from "~/service/comment";
import { getCookie } from "~/service/user";

const actionSchema = z.object({
  text: z.string(),
  postId: z.string(),
  commentId: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const json = await JSON.parse(await request.text());
    const { text, postId, commentId } = await actionSchema.parse(json);
    const id = await commentOnPost(cookie, text, postId, commentId);
    return id;
  } catch (err) {
    console.log(err);
    return null;
  }
};
