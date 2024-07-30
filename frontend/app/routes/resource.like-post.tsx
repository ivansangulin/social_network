import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { likePost } from "~/service/post";
import { getCookie } from "~/service/user";

const actionSchema = z.object({
  liked: z.boolean(),
  postId: z.string(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const json = JSON.parse(await request.text());
    const { liked, postId } = actionSchema.parse(json);
    return await likePost(cookie, liked, postId);
  } catch (err) {
    console.log(err);
    return false;
  }
};
