import { json, LoaderFunctionArgs } from "@remix-run/node";
import { getMyPosts, getUserPosts } from "~/service/post";

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
