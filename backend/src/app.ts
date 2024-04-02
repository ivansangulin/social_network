import express, { json } from "express";
import dotenv from "dotenv";
import userRouter from "./controllers/AuthController";
import cookieParser from "cookie-parser";

dotenv.config();
const env = process.env;

const port = env.PORT ?? 4200;
const app = express();
app.use(json());
app.use(cookieParser(env.SECRET_ACCESS_TOKEN));
app.use("/user", userRouter);

app.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
