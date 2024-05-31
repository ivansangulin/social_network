import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMyFriends, getUserFriends } from "~/service/friendship";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!getCookie(request)) {
    return redirect("/login");
  }
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  const search = params.get("search");
  const username = params.get("username");
  let friendsPaging;
  if (!username) {
    friendsPaging = await getMyFriends(request, cursor, search);
  } else {
    friendsPaging = await getUserFriends(request, username, cursor, search);
  }
  return json(friendsPaging);
};
