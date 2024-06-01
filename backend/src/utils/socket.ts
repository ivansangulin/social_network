import { io, ISocket } from "../app";
import { readFriendRequests } from "../services/FriendRequestService";
import { createMessage, readMessages } from "../services/MessagingService";
import { createPost } from "../services/PostService";
import { findUserUuidById, updateStatus } from "../services/UserService";

export const connectSocket = () => {
  io.on("connection", async (socket: ISocket) => {
    const userId = Number(socket.userId);
    console.log(`New client connected - ${userId}`);
    const [userUuid] = await Promise.all([
      findUserUuidById(userId),
      updateStatus(userId, true),
    ]);
    socket.join(userUuid);

    const messageListener = async (
      {
        friendUuid,
        message,
        created,
      }: {
        friendUuid: string;
        message: string;
        created: string;
      },
      ack: (success: boolean) => void
    ) => {
      try {
        const createdDate = new Date(created);
        const myData = await createMessage(
          userId,
          friendUuid,
          message,
          createdDate
        );
        io.to(friendUuid).emit(
          "message",
          {
            sender: userUuid,
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
        io.to(userUuid).emit("newPost", post);
      } catch (err) {
        console.log(err);
        io.to(userUuid).emit("newPost", "Failed to create new post!");
      } finally {
        if (ack) ack(true);
      }
    };
    socket.on("newPost", postListener);

    const typingListener = async ({
      friendUuid,
      typing,
    }: {
      friendUuid: string;
      typing: boolean;
    }) => {
      io.to(friendUuid).emit("userTyping", {
        friendUuid: userUuid,
        typing: typing,
      });
    };
    socket.on("userTyping", typingListener);

    const readMessagesListener = async ({
      friendUuid,
      readAt,
    }: {
      friendUuid: string;
      readAt: string;
    }) => {
      try {
        await readMessages(userId, friendUuid, new Date(readAt));
        io.to(friendUuid).emit("readMessages", { friendUuid: userUuid });
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

    socket.on("disconnect", async () => {
      await updateStatus(userId, false);
      console.log(`Client disconnected - ${userId}`);
      socket.removeAllListeners();
      socket.leave(userUuid);
    });
  });
};
