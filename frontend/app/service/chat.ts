import { z } from "zod";
import { getCookie } from "./user";

const messageSchema = z.object({
  sender: z.string(),
  message: z.string(),
  error: z.boolean().optional(),
  time: z.string(),
});

const messagesPagingSchema = z.object({
  count: z.number(),
  cursor: z.string(),
  lastMessageReadTime: z.string().nullable(),
  messages: z.array(messageSchema),
});

export type Message = z.infer<typeof messageSchema>;
export type MessagesPaging = z.infer<typeof messagesPagingSchema>;

export const getMessages = async (
  friendId: string,
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
      }/messaging/messages?friendId=${friendId}&cursor=${cursor ?? ""}`,
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

    const messages = await messagesPagingSchema.parse(
      await messagesResponse.json()
    );

    return messages;
  } catch (err) {
    console.log(err);
    return null;
  }
};
