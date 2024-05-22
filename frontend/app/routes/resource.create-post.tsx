import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { createPost } from "~/service/post";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const createPostData = await z.string().parse(formData.get("text"));
    const created = await createPost(request, createPostData);
    if (created) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
