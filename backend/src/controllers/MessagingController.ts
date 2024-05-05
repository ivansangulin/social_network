import { Request, Response, Router } from "express";
import { getChatUuid } from "../services/MessagingService";
import { check } from "express-validator";

const messagingRouter = Router();

messagingRouter.get(
  "/chat-uuid",
  check("friendUuid").isString().trim().notEmpty(),
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const friendUuid = req.query.friendUuid as string;
    try {
      const chatUuid = await getChatUuid(Number(userId), friendUuid);
      return res.status(200).json(chatUuid);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Failed fetching chat id!");
    }
  }
);

export default messagingRouter;
