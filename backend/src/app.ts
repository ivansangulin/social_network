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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Cookie"],
  },
});

io.use(SocketAuth);

io.on("connection", (socket: ISocket) => {
  console.log("New client connected");
  console.log(socket.userId);

  socket.on("joinChat", (chatUuid) => {
    socket.join(chatUuid);
    socket.on(
      chatUuid,
      ({ chatUuid, message }: { chatUuid: string; message: string }) => {
        io.to(chatUuid).emit(chatUuid, message);
      }
    );
    console.log(`User joined chat: ${chatUuid}`);
  });

  socket.on("leaveChat", (chatUuid) => {
    console.log(`User left chat ${chatUuid}`);
    socket.off(chatUuid, (message) => {
      console.log(message);
    });
    socket.leave(chatUuid);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected" + " " + socket.userId);
  });
});

server.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
