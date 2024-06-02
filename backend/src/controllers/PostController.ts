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
import { createNotification } from "../services/NotificationService";
import { io } from "../app";

const postRouter = Router();

postRouter.get("/my-posts", async (req: Request, res: Response) => {
  const userId = Number(req.userId);
  const cursor =
    typeof req.query.cursor === "string" ? Number(req.query.cursor) : undefined;

  try {
    const userPostPaging = await getUserPosts(userId, cursor);
    return res.status(200).json(userPostPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching posts!");
  }
});

postRouter.get("/main-page-posts", async (req: Request, res: Response) => {
  const userId = Number(req.userId);
  const cursor =
    typeof req.query.cursor === "string" ? Number(req.query.cursor) : undefined;
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
    const myId = Number(req.userId);
    const username = req.query.username as string;
    const cursor =
      typeof req.query.cursor === "string"
        ? Number(req.query.cursor)
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
  check("postId").trim().isNumeric().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = Number(req.userId);
    const liked = !!req.body.liked;
    const postId = Number(req.body.postId);
    try {
      if (liked) {
        const { username, friendId, friendUuid } = await likePost(
          userId,
          postId
        );
        if (userId !== friendId) {
          const notification = await createNotification(
            friendId,
            postId,
            `${username} has liked your post!`,
            userId
          );
          io.to(friendUuid).emit("notification", { notification });
        }
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
