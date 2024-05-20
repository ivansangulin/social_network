import { Request, Response, Router } from "express";
import { getMessages } from "../services/MessagingService";
import { check } from "express-validator";

const messagingRouter = Router();

messagingRouter.get(
  "/messages",
  check("friendUuid").isString().trim().notEmpty().isUUID(),
  check("chatUuid").isString().trim().notEmpty().isUUID(),
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const friendUuid = req.query.friendUuid as string;
    const cursor =
      typeof req.query.cursor === "string"
        ? Number(req.query.cursor)
        : undefined;
    try {
      const messages = await getMessages(
        Number(userId),
        friendUuid,
        cursor
      );
      return res.status(200).send(messages);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Failed fetching messages!");
    }
  }
);

export default messagingRouter;
