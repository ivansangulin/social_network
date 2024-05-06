import { z } from "zod";
import { getCookie } from "./user";

const messageSchema = z.object({
  sender: z.string(),
  message: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

export const getMessages = async (
  friendUuid: string,
  cursor: string | null,
  request: Request
) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const messagesResponse = await fetch(
      `${
        process.env.BACKEND_URL
      }/messaging/messages?friendUuid=${friendUuid}&cursor=${cursor ?? ""}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );

    if (!messagesResponse.ok) {
      return null;
    }

    const messages = await z
      .array(messageSchema)
      .parse(await messagesResponse.json());

    return messages;
  } catch (err) {
    console.log(err);
    return null;
  }
};
