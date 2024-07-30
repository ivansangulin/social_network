import { z } from "zod";
import { friendSchema } from "./friendship";

const messageSchema = z.object({
  sender_id: z.string(),
  message: z.string(),
  error: z.boolean().optional(),
  created: z.string(),
});

const messagesPagingSchema = z.object({
  count: z.number(),
  cursor: z.string(),
  lastMessageReadTime: z.string().nullable(),
  messages: z.array(messageSchema),
});

const chatSchema = z.object({
  id: z.string(),
  message: messageSchema.nullish(),
  user: friendSchema,
  unreadCount: z.number(),
});

const chatsPagingSchema = z.object({
  count: z.number(),
  chats: z.array(chatSchema),
  cursor: z.string(),
});

export type Message = z.infer<typeof messageSchema>;
export type MessagesPaging = z.infer<typeof messagesPagingSchema>;
export type Chat = z.infer<typeof chatSchema>;
export type ChatsPaging = z.infer<typeof chatsPagingSchema>;

export const getMessages = async (
  chatId: string,
  cursor: string | null,
  cookie: string
) => {
  try {
    const messagesResponse = await fetch(
      `${process.env.BACKEND_URL}/messaging/messages?chatId=${chatId}&cursor=${
        cursor ?? ""
      }`,
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

export const getChats = async (cookie: string, cursor: string | null) => {
  try {
    const chatsResponse = await fetch(
      `${process.env.BACKEND_URL}/messaging/chats?cursor=${cursor ?? ""}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!chatsResponse.ok) {
      return null;
    }
    const chats = chatsPagingSchema.parse(await chatsResponse.json());
    return chats;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getNewChat = async (cookie: string, friendId: string) => {
  try {
    const chatResponse = await fetch(
      `${process.env.BACKEND_URL}/messaging/new-chat?friendId=${friendId}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!chatResponse.ok) {
      return null;
    }
    const chat = chatSchema.parse(await chatResponse.json());
    return chat;
  } catch (err) {
    console.log(err);
    return null;
  }
};
