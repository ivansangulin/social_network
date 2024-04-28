import { json, LoaderFunctionArgs } from "@remix-run/node";
import { getUserPosts } from "~/service/post";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  const postPaging = await getUserPosts(request, cursor);
  return json(postPaging);
};
