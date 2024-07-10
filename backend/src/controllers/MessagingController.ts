import { Request, Response, Router } from "express";
import {
  getChats,
  getMessages,
  getNewChat,
} from "../services/MessagingService";
import { check } from "express-validator";
import Validate from "../middleware/validate";

const messagingRouter = Router();

messagingRouter.get(
  "/messages",
  check("chatId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("cursor").optional().trim().isString(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const chatId = req.query.chatId as string;
    const cursor = req.query.cursor as string;
    try {
      const messages = await getMessages(userId, chatId, cursor);
      return res.status(200).send(messages);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Failed fetching messages!");
    }
  }
);

messagingRouter.get(
  "/chats",
  check("cursor").optional().trim().isString(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const cursor = req.query.cursor as string;
    try {
      const chatsPaging = await getChats(userId, cursor);
      return res.status(200).json(chatsPaging);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't fetch chats!");
    }
  }
);

messagingRouter.get(
  "/new-chat",
  check("friendId").isString().trim().notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const friendId = req.query.friendId as string;
    try {
      const newChat = await getNewChat(userId, friendId);
      return res.status(200).json(newChat);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't fetch new chat!");
    }
  }
);

export default messagingRouter;
