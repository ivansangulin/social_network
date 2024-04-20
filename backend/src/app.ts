import express from "express";
import dotenv from "dotenv";
import userRouter from "./controllers/AuthController";
import cookieParser from "cookie-parser";
import { json } from "body-parser";

dotenv.config();
const env = process.env;

const port = env.PORT ?? 4200;
const app = express();
app.use(json());
app.use(cookieParser(env.SECRET_ACCESS_TOKEN));

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

app.use("/user", userRouter);

app.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
