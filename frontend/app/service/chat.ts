import { z } from "zod";
import { getCookie } from "./user";

export const getChatUuid = async (friendUuid: string, request: Request) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const chatUuidResponse = await fetch(
      `${process.env.BACKEND_URL}/messaging/chat-uuid?friendUuid=${friendUuid}`,
      { method: "GET", headers: { Cookie: cookie } }
    );
    const chatUuid = await z.string().parse(await chatUuidResponse.json());
    return chatUuid;
  } catch (err) {
    console.log(err);
    return null;
  }
};
