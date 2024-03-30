import express, { json } from "express";
import dotenv from "dotenv";
import userRouter from "./controllers/AuthController";

dotenv.config();
const env = process.env;

const port = env.PORT ?? 4200;
const app = express();
app.use(json());
app.use("/user", userRouter);

app.listen(port, async () => {
  console.log(`App running in port ${port}`);
});
