import express from "express";
import dotenv from "dotenv";
import userRouter from "./controllers/AuthController";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import friendshipRouter from "./controllers/FriendshipController";
import { RequiresAuth } from "./middleware/auth";
import postRouter from "./controllers/PostController";

dotenv.config();
const env = process.env;

const port = env.PORT ?? 4200;
const app = express();
app.use(json());
app.use(cookieParser(env.SECRET_ACCESS_TOKEN));
app.use("/image/profile_picture", RequiresAuth, express.static("public/image"));

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

app.use("/user", userRouter);
app.use("/friendship", RequiresAuth, friendshipRouter);
app.use("/post", RequiresAuth, postRouter);

app.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
