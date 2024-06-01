import { Router, Request, Response } from "express";
import { check } from "express-validator";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getMyPendingFriendRequests,
  sendFriendRequest,
} from "../services/FriendRequestService";
import { io } from "../app";
import { removeFriend } from "../services/FriendshipService";
import Validate from "../middleware/validate";

const friendRequestRouter = Router();

friendRequestRouter.get("/", async (req: Request, res: Response) => {
  const userId = Number(req.userId);
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
  check("friendUsername").isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = Number(req.userId);
    const friendUsername = req.body.friendUsername;
    try {
      const { toUserUuid, username, profile_picture_uuid } =
        await sendFriendRequest(userId, friendUsername, new Date());
      io.to(toUserUuid).emit("newFriendRequest", {
        username,
        profile_picture_uuid,
      });
      return res.status(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't add friend");
    }
  }
);

friendRequestRouter.post(
  "/remove",
  check("friendUsername").isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = Number(req.userId);
    const friendUsername = req.body.friendUsername;
    try {
      await removeFriend(userId, friendUsername);
      return res.status(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't remove friend");
    }
  }
);

friendRequestRouter.post(
  "/handle",
  check("friendUsername").isString().trim().notEmpty(),
  check("accepted").isBoolean().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = Number(req.userId);
    const friendUsername = req.body.friendUsername;
    const accepted = req.body.accepted;
    try {
      if (accepted) {
        const { friendUuid, username } = await acceptFriendRequest(
          userId,
          friendUsername
        );
        io.to(friendUuid).emit("notification", {
          text: `${username} accepted your friend request!
            `,
        });
      } else {
        const { senderId, senderUsername } = await declineFriendRequest(
          userId,
          friendUsername
        );
        if (senderId === userId) {
          io.emit("canceledRequest", { friendUsername: senderUsername });
        }
      }
      return res.status(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't handle friend request");
    }
  }
);

export default friendRequestRouter;
