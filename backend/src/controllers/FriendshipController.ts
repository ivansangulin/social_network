import { Router, Request, Response } from "express";
import { areFriends, getFriends } from "../services/FriendshipService";
import { check } from "express-validator";
import { findUserDataFromUsername } from "../services/UserService";

const friendshipRouter = Router();

friendshipRouter.get("/my-friends", async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const cursor =
    typeof req.query.cursor === "string"
      ? (req.query.cursor as string)
      : undefined;
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  try {
    const friendsPaging = await getFriends(userId, cursor, search);
    return res.status(200).json(friendsPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching friends!");
  }
});

friendshipRouter.get(
  "/user-friends",
  check("username").exists({ values: "falsy" }).isString().trim().notEmpty(),
  async (req: Request, res: Response) => {
    const myId = req.userId as string;
    const username = req.query.username as string;
    const cursor =
      typeof req.query.cursor === "string"
        ? (req.query.cursor as string)
        : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    try {
      const userData = await findUserDataFromUsername(username);
      if (!userData) {
        return res.status(404).send("User doesn't exist!");
      }
      const friends = await areFriends(myId, userData.id);
      if (friends || !userData.locked_profile) {
        const friends = await getFriends(userData.id, cursor, search);
        return res.status(200).json(friends);
      }
      return res
        .status(403)
        .send("You are not allowed to view this person's profile");
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error occured fetching user friends!");
    }
  }
);

export default friendshipRouter;
