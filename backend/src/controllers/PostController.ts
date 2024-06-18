import { Router, Request, Response } from "express";
import {
  getMainPagePosts,
  getUserPosts,
  likePost,
  dislikePost,
  getPost,
  canInteractWithPost,
  sharePost,
  postIsShareable,
} from "../services/PostService";
import { check } from "express-validator";
import Validate from "../middleware/validate";
import { areFriends } from "../services/FriendshipService";
import { findUserDataFromUsername } from "../services/UserService";

const postRouter = Router();

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
  check("username").exists({ values: "falsy" }).isString().trim().notEmpty(),
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
      if (friends || userData.public_profile || myId === userData.id) {
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
  check("liked").exists({ values: "null" }).isBoolean().notEmpty(),
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const liked = !!req.body.liked;
    const postId = req.body.postId as string;
    try {
      if (!(await canInteractWithPost(userId, postId))) {
        return res.sendStatus(403);
      }
      if (liked) {
        await likePost(userId, postId);
      } else {
        await dislikePost(userId, postId);
      }
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't like/unlike a post!");
    }
  }
);

postRouter.get(
  "/",
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const myId = req.userId as string;
    const postId = req.query.postId as string;
    try {
      const post = await getPost(myId, postId);
      if (post.user_id === myId) {
        return res.status(200).json(post);
      }
      const friends = await areFriends(myId, post.user_id);
      if (friends || post.user.public_profile) {
        return res.status(200).json(post);
      }
      return res
        .status(403)
        .send("You are not allowed to view this person's profile");
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't fetch post!");
    }
  }
);

postRouter.post(
  "/share",
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("text").isString().trim().optional(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const postId = req.body.postId as string;
    const text = req.body.text as string | undefined;
    try {
      if (
        !(await canInteractWithPost(userId, postId)) ||
        !(await postIsShareable(postId))
      ) {
        return res.sendStatus(403);
      }
      const { post } = await sharePost(userId, postId, text);
      return res.status(200).json(post);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't share post!");
    }
  }
);

export default postRouter;
