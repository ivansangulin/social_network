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
import { createMessage, readMessages } from "./services/MessagingService";
import { findUserUuidById, updateStatus } from "./services/UserService";
import { createPost } from "./services/PostService";
import { connectSocket } from "./utils/socket";
import friendRequestRouter from "./controllers/FriendRequestController";
import notificationRouter from "./controllers/NotificationController";

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
app.use("/friend-request", RequiresAuth, friendRequestRouter);
app.use("/notification", RequiresAuth, notificationRouter);

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Cookie"],
    credentials: true,
  },
});

io.use(SocketAuth);

connectSocket();

server.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
