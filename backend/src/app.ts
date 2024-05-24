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
import { findUserUuidById } from "./services/UserService";
import { createPost } from "./services/PostService";
import { getFriendsUuids } from "./services/FriendshipService";

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
  console.log("New client connected");
  console.log(socket.userId);
  const userUuid = await findUserUuidById(Number(socket.userId));
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
      const myData = await createMessage(
        Number(socket.userId),
        friendUuid,
        message
      );
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
      const post = await createPost(Number(socket.userId), text);
      const friendsUuids = await getFriendsUuids(
        Number(socket.userId),
        userUuid
      );
      friendsUuids.forEach((uuid) => io.to(uuid).emit("newPost", post));
      io.to(userUuid).emit("newPost", post);
    } catch (err) {
      console.log(err);
      io.to(userUuid).emit("newPost", "Failed to create new post!");
    } finally {
      if (ack) ack(true);
    }
  };
  socket.on("newPost", postListener);

  socket.on("disconnect", () => {
    console.log("Client disconnected" + " " + socket.userId);
    socket.off("message", messageListener);
    socket.off("newPost", postListener);
    socket.leave(userUuid);
  });
});

server.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
