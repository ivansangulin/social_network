import { Router, Request, Response } from "express";
import { getFriends } from "../services/FriendshipService";

const friendshipRouter = Router();

friendshipRouter.get("/friends", async (req: Request, res: Response) => {
  const userId = Number(req.userId);
  const cursor =
    typeof req.query.cursor === "string" ? Number(req.query.cursor) : undefined;
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  try {
    const friendsPaging = await getFriends(userId, cursor, search);
    return res.status(200).json(friendsPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching friends!");
  }
});

export default friendshipRouter;
