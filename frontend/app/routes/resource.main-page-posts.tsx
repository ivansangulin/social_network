import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMainPagePosts } from "~/service/post";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const posts = await getMainPagePosts(cookie, cursor);
    return json(posts);
  } catch (err) {
    console.log(err);
    return null;
  }
};
