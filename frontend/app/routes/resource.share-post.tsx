import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { sharePost } from "~/service/post";
import { getCookie } from "~/service/user";

const actionSchema = z.object({
  postId: z.string(),
  text: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const json = JSON.parse(await request.text());
    const { postId, text } = actionSchema.parse(json);
    return await sharePost(cookie, postId, text);
  } catch (err) {
    console.log(err);
    return null;
  }
};
