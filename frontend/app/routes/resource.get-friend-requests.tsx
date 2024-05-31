import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getPendingFriendRequests } from "~/service/friend-requests";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!getCookie(request)) {
    return redirect("/login");
  }
  const pendingRequests = await getPendingFriendRequests(request);

  return pendingRequests;
};
