import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMyFriends, getUserFriends } from "~/service/friendship";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return redirect("/login");
  }
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  const search = params.get("search");
  const username = params.get("username");
  let friendsPaging;
  if (!username) {
    friendsPaging = await getMyFriends(cookie, cursor, search);
  } else {
    friendsPaging = await getUserFriends(cookie, username, cursor, search);
  }
  return json(friendsPaging);
};
