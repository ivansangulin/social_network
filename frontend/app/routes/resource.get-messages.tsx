import { LoaderFunctionArgs } from "@remix-run/node";
import { getMessages } from "~/service/chat";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const friendUuid = params.get("friendUuid");
  const cursor = params.get("cursor");
  if (friendUuid) {
    const messages = getMessages(friendUuid, cursor, request);
    return messages;
  }

  return null;
};
