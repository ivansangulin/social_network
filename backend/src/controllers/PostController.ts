import { Router, Request, Response } from "express";
import {
  getMainPagePosts,
  getUserPosts,
  likePost,
  dislikePost,
} from "../services/PostService";
import { check } from "express-validator";
import Validate from "../middleware/validate";
import { areFriends } from "../services/FriendshipService";
import { findUserDataFromUsername } from "../services/UserService";

const postRouter = Router();

postRouter.get("/my-posts", async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const cursor =
    typeof req.query.cursor === "string"
      ? (req.query.cursor as string)
      : undefined;

  try {
    const userPostPaging = await getUserPosts(userId, cursor);
    return res.status(200).json(userPostPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching posts!");
  }
});

postRouter.get("/main-page-posts", async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const cursor =
    typeof req.query.cursor === "string"
      ? (req.query.cursor as string)
      : undefined;
  try {
    const mainPagePosts = await getMainPagePosts(userId, cursor);
    return res.status(200).json(mainPagePosts);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Couldn't fetch posts!");
  }
});

postRouter.get(
  "/user-posts",
  check("username").isString().trim().notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    const myId = req.userId as string;
    const username = req.query.username as string;
    const cursor =
      typeof req.query.cursor === "string"
        ? (req.query.cursor as string)
        : undefined;
    try {
      const userData = await findUserDataFromUsername(username);
      if (!userData) {
        return res.status(404).send("User doesn't exist!");
      }
      const friends = await areFriends(myId, userData.id);
      if (friends || !userData.locked_profile) {
        const posts = await getUserPosts(userData.id, cursor);
        return res.status(200).json(posts);
      }
      return res
        .status(403)
        .send("You are not allowed to view this person's profile");
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error occured fetching user posts!");
    }
  }
);

postRouter.post(
  "/like",
  check("liked").isBoolean().notEmpty(),
  check("postId").isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const liked = !!req.body.liked;
    const postId = req.body.postId as string;
    try {
      if (liked) {
        await likePost(userId, postId);
      } else {
        await dislikePost(userId, postId);
      }
      return res.status(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't like/unlike a post!");
    }
  }
);

export default postRouter;
