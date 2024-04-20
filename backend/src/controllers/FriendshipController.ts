import { Router, Request, Response } from "express";
import { getFriends } from "../services/FriendshipService";

const friendshipRouter = Router();

friendshipRouter.get("/friends", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.sendStatus(401);
  }
  try {
    const friends = await getFriends(Number(userId));
    return res.status(200).json(friends);
  } catch (err) {
    return res.status(500).send("Error occured fetching friends!");
  }
});

export default friendshipRouter;
