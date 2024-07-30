import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getMessages } from "~/service/chat";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return redirect("/login");
  }
  const params = new URL(request.url).searchParams;
  const chatId = params.get("chatId");
  const cursor = params.get("cursor");
  if (chatId) {
    const messages = await getMessages(chatId, cursor, cookie);
    return messages;
  }

  return null;
};
