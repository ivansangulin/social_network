import { json, LoaderFunctionArgs } from "@remix-run/node";
import { getMainPagePosts } from "~/service/post";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  try {
    const posts = await getMainPagePosts(request, cursor);
    return json(posts);
  } catch (err) {
    console.log(err);
    return null;
  }
};
