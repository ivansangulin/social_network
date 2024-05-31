import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMessages } from "~/service/chat";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!getCookie(request)) {
    return redirect("/login");
  }
  const params = new URL(request.url).searchParams;
  const friendUuid = params.get("friendUuid");
  const cursor = params.get("cursor");
  if (friendUuid) {
    const messages = await getMessages(friendUuid, cursor, request);
    return messages;
  }

  return null;
};
