import { io, ISocket } from "../app";
import { readFriendRequests } from "../services/FriendRequestService";
import {
  createMessage,
  getChatParticipants,
  readMessages,
} from "../services/MessagingService";
import { readNotifications } from "../services/NotificationService";
import { updateStatus } from "../services/UserService";

export const connectSocket = () => {
  io.on("connection", async (socket: ISocket) => {
    const userId = socket.userId as string;
    await updateStatus(userId, true);
    console.log(`New client connected - ${userId}`);
    socket.join(userId);

    const messageListener = async (
      {
        chatId,
        message,
        created,
      }: {
        chatId: string;
        message: string;
        created: string;
      },
      ack: (success: boolean) => void
    ) => {
      try {
        const createdDate = new Date(created);
        const [{ myData, unreadCount }, participants] = await Promise.all([
          createMessage(userId, chatId, message, createdDate),
          getChatParticipants(userId, chatId),
        ]);
        participants.forEach((p) => {
          io.to(p.user_id).emit(
            "message",
            chatId,
            {
              sender_id: userId,
              message,
              created,
            },
            myData,
            unreadCount
          );
        });
        if (ack) ack(true);
      } catch (err) {
        console.log(err);
        if (ack) ack(false);
      }
    };
    socket.on("message", messageListener);

    const typingListener = async ({
      chatId,
      typing,
    }: {
      chatId: string;
      typing: boolean;
    }) => {
      const participants = await getChatParticipants(userId, chatId);
      participants.forEach((p) => {
        io.to(p.user_id).emit("userTyping", {
          chatId: chatId,
          typing: typing,
        });
      });
    };
    socket.on("userTyping", typingListener);

    const readMessagesListener = async ({
      chatId,
      readAt,
    }: {
      chatId: string;
      readAt: string;
    }) => {
      try {
        const [participants] = await Promise.all([
          getChatParticipants(userId, chatId),
          readMessages(userId, chatId, new Date(readAt)),
        ]);
        participants.forEach((p) => {
          io.to(p.user_id).emit("readMessages", { chatId: chatId });
        });
      } catch (err) {
        console.log(err);
      }
    };
    socket.on("readMessages", readMessagesListener);

    const readFriendRequestsListener = async () => {
      try {
        await readFriendRequests(userId);
      } catch (err) {
        console.log(err);
      }
    };
    socket.on("readFriendRequests", readFriendRequestsListener);

    const readNotificationsListener = async () => {
      try {
        await readNotifications(userId);
      } catch (err) {
        console.log(err);
      }
    };
    socket.on("readNotifications", readNotificationsListener);

    socket.on("disconnect", async () => {
      await updateStatus(userId, false);
      console.log(`Client disconnected - ${userId}`);
      socket.removeAllListeners();
      socket.leave(userId);
    });
  });
};
