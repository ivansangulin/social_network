import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { z } from "zod";
import {
  addFriend,
  getPendingFriendRequests,
  handleFriendRequest,
  removeFriend,
} from "~/service/friend-requests";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!getCookie(request)) {
    return redirect("/login");
  }
  const pendingRequests = await getPendingFriendRequests(request);

  return pendingRequests;
};

const actionSchema = z.object({
  action: z.enum(["add", "remove", "handle"]),
  friendId: z.string(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const json = await JSON.parse(await request.text());
    const { action, friendId } = await actionSchema.parse(json);
    if (!action) return false;
    if (action === "add") {
      return addFriend(request, friendId);
    } else if (action === "remove") {
      return removeFriend(request, friendId);
    } else {
      const accepted = await z.boolean().parse(json.accepted);
      return handleFriendRequest(request, friendId, accepted);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
