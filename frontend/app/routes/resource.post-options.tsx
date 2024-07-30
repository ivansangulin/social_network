import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { deletePost, editPost } from "~/service/post";
import { getCookie } from "~/service/user";

export const action = async ({ request }: LoaderFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const json = await request.json();
    const postId = await z.string().parse(json.postId);
    if (request.method.toLocaleLowerCase() === "delete") {
      return await deletePost(cookie, postId);
    } else {
      const text = await z.string().parse(json.text);
      return await editPost(cookie, postId, text);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
