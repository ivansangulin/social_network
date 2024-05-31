import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMainPagePosts } from "~/service/post";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!getCookie(request)) {
    return redirect("/login");
  }
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
