import { LoaderFunctionArgs } from "@remix-run/node";
import { getChatUuid } from "~/service/chat";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const friendUuid = params.get("friendUuid");
  if (friendUuid) {
    const chatUuid = await getChatUuid(friendUuid, request);
    return chatUuid;
  }
  return null;
};
