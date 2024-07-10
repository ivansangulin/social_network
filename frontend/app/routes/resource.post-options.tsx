import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { deletePost, editPost } from "~/service/post";

export const action = async ({ request }: LoaderFunctionArgs) => {
  try {
    const json = await request.json();
    const postId = await z.string().parse(json.postId);
    if (request.method.toLocaleLowerCase() === "delete") {
      return await deletePost(request, postId);
    } else {
      const text = await z.string().parse(json.text);
      return await editPost(request, postId, text);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
