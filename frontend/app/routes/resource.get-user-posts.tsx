import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMyPosts, getUserPosts } from "~/service/post";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!getCookie(request)) {
    return redirect("/login");
  }
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  const username = params.get("username");
  let postPaging;
  if (!username) {
    postPaging = await getMyPosts(request, cursor);
  } else {
    postPaging = await getUserPosts(request, username, cursor);
  }
  return json(postPaging);
};
