import { json, LoaderFunctionArgs } from "@remix-run/node";
import { getFriends } from "~/service/friendship";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  const search = params.get("search");
  const friendsPaging = await getFriends(request, cursor, search);
  return json(friendsPaging);
};
