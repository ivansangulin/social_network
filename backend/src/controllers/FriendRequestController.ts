import { Router, Request, Response } from "express";
import { check } from "express-validator";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getMyPendingFriendRequests,
  sendFriendRequest,
} from "../services/FriendRequestService";
import { removeFriend } from "../services/FriendshipService";
import Validate from "../middleware/validate";

const friendRequestRouter = Router();

friendRequestRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.userId as string;
  try {
    const pendingRequests = await getMyPendingFriendRequests(userId);
    return res.status(200).json(pendingRequests);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error occured fetching friend requests!");
  }
});

friendRequestRouter.post(
  "/add",
  check("friendId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const friendId = req.body.friendId;
    try {
      await sendFriendRequest(userId, friendId, new Date());
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't add friend");
    }
  }
);

friendRequestRouter.post(
  "/remove",
  check("friendId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const friendId = req.body.friendId;
    try {
      await removeFriend(userId, friendId);
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't remove friend");
    }
  }
);

friendRequestRouter.post(
  "/handle",
  check("friendId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("accepted").exists({ values: "null" }).isBoolean().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const friendId = req.body.friendId;
    const accepted = req.body.accepted;
    try {
      if (accepted) {
        await acceptFriendRequest(userId, friendId);
      } else {
        await declineFriendRequest(userId, friendId);
      }
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't handle friend request");
    }
  }
);

export default friendRequestRouter;
