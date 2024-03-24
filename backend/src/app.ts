import express, { json } from "express";
import dotenv from "dotenv";
import "reflect-metadata";
import { DBConnection } from "./data-source";

dotenv.config();
const env = process.env;

const port = env.PORT ?? 4200;
const app = express();
app.use(json());

app.listen(port, async () => {
  DBConnection.initialize().then(() => {
    console.log("Db connected");
  });
  console.log(`App running in port ${port}`);
});
