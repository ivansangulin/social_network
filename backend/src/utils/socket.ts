import { io, ISocket } from "../app";
import { readFriendRequests } from "../services/FriendRequestService";
import { createMessage, readMessages } from "../services/MessagingService";
import { readNotifications } from "../services/NotificationService";
import { createPost } from "../services/PostService";
import { updateStatus } from "../services/UserService";

export const connectSocket = () => {
  io.on("connection", async (socket: ISocket) => {
    const userId = socket.userId as string;
    console.log(`New client connected - ${userId}`);
    socket.join(userId);

    const messageListener = async (
      {
        friendId,
        message,
        created,
      }: {
        friendId: string;
        message: string;
        created: string;
      },
      ack: (success: boolean) => void
    ) => {
      try {
        const createdDate = new Date(created);
        const myData = await createMessage(
          userId,
          friendId,
          message,
          createdDate
        );
        io.to(friendId).emit(
          "message",
          {
            sender: userId,
            message,
            time: createdDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          myData
        );
        if (ack) ack(true);
      } catch (err) {
        console.log(err);
        if (ack) ack(false);
      }
    };
    socket.on("message", messageListener);

    const postListener = async (
      text: string,
      ack: (finished: boolean) => void
    ) => {
      try {
        const post = await createPost(userId, text);
        io.to(userId).emit("newPost", post);
      } catch (err) {
        console.log(err);
        io.to(userId).emit("newPost", "Failed to create new post!");
      } finally {
        if (ack) ack(true);
      }
    };
    socket.on("newPost", postListener);

    const typingListener = async ({
      friendId,
      typing,
    }: {
      friendId: string;
      typing: boolean;
    }) => {
      io.to(friendId).emit("userTyping", {
        friendId: userId,
        typing: typing,
      });
    };
    socket.on("userTyping", typingListener);

    const readMessagesListener = async ({
      friendId,
      readAt,
    }: {
      friendId: string;
      readAt: string;
    }) => {
      try {
        await readMessages(userId, friendId, new Date(readAt));
        io.to(friendId).emit("readMessages", { friendId: userId });
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
