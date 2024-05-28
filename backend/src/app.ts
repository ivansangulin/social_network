import express from "express";
import dotenv from "dotenv";
import userRouter from "./controllers/AuthController";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import friendshipRouter from "./controllers/FriendshipController";
import { RequiresAuth, SocketAuth } from "./middleware/auth";
import postRouter from "./controllers/PostController";
import { Server, Socket } from "socket.io";
import http from "http";
import messagingRouter from "./controllers/MessagingController";
import { createMessage } from "./services/MessagingService";
import { findUserUuidById, updateStatus } from "./services/UserService";
import { createPost } from "./services/PostService";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
export interface ISocket extends Socket {
  userId?: string;
}

dotenv.config();
const env = process.env;

const port = env.PORT ?? 4200;
const app = express();

app.use(json());
app.use(cookieParser(env.SECRET_ACCESS_TOKEN));
app.use("/image/profile_picture", RequiresAuth, express.static("public/image"));
app.use("/user", userRouter);
app.use("/friendship", RequiresAuth, friendshipRouter);
app.use("/post", RequiresAuth, postRouter);
app.use("/messaging", RequiresAuth, messagingRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Cookie"],
    credentials: true,
  },
});

io.use(SocketAuth);

io.on("connection", async (socket: ISocket) => {
  const userId = Number(socket.userId);
  console.log("New client connected");
  console.log(userId);
  const [userUuid] = await Promise.all([
    findUserUuidById(userId),
    updateStatus(userId, true),
  ]);
  socket.join(userUuid);

  const messageListener = async (
    {
      friendUuid,
      message,
    }: {
      friendUuid: string;
      message: string;
    },
    ack: (success: boolean) => void
  ) => {
    try {
      const myData = await createMessage(userId, friendUuid, message);
      io.to(friendUuid).emit("message", { sender: userUuid, message }, myData);
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

  socket.on("disconnect", async () => {
    await updateStatus(userId, false);
    console.log("Client disconnected" + " " + userId);
    socket.off("message", messageListener);
    socket.off("newPost", postListener);
    socket.off("userTyping", typingListener);
    socket.leave(userUuid);
  });
});

server.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
