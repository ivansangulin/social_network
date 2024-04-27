import { Router, Request, Response } from "express";
import { getFriends } from "../services/FriendshipService";

const friendshipRouter = Router();

friendshipRouter.get("/friends", async (req: Request, res: Response) => {
  const userId = req.userId;
  const cursor =
    typeof req.query.cursor === "string" ? Number(req.query.cursor) : undefined;
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;
  if (!userId) {
    return res.sendStatus(401);
  }
  try {
    const friendsPaging = await getFriends(Number(userId), cursor, search);
    return res.status(200).json(friendsPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching friends!");
  }
});

export default friendshipRouter;
