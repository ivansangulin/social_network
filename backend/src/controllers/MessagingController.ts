import { Request, Response, Router } from "express";
import { getMessages } from "../services/MessagingService";
import { check } from "express-validator";
import Validate from "../middleware/validate";

const messagingRouter = Router();

messagingRouter.get(
  "/messages",
  check("friendId").isString().trim().notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const friendId = req.query.friendId as string;
    const cursor =
      typeof req.query.cursor === "string"
        ? (req.query.cursor as string)
        : undefined;
    try {
      const messages = await getMessages(userId, friendId, cursor);
      return res.status(200).send(messages);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Failed fetching messages!");
    }
  }
);

export default messagingRouter;
