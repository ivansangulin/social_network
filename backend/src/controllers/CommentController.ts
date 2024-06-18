import { Router, Request, Response } from "express";
import { check } from "express-validator";
import Validate from "../middleware/validate";
import { canInteractWithPost } from "../services/PostService";
import {
  canInteractWithComment,
  createComment,
  dislikeComment,
  getComments,
  getReplies,
  likeComment,
} from "../services/CommentService";

const commentRouter = Router();

commentRouter.post(
  "/",
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("text").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("commentId").optional().isString(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const postId = req.body.postId as string;
    const text = req.body.text as string;
    const commentId = req.body.commentId as string | undefined;
    try {
      var id;
      if (!commentId) {
        if (!(await canInteractWithPost(userId, postId))) {
          return res.sendStatus(403);
        }
        id = await createComment(userId, postId, text);
      } else {
        if (!(await canInteractWithComment(userId, commentId))) {
          return res.sendStatus(403);
        }
        id = await createComment(userId, postId, text, commentId);
      }
      return res.status(200).json(id);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't comment on post!");
    }
  }
);

commentRouter.post(
  "/like",
  check("commentId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("liked").exists({ values: "null" }).isBoolean().notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const commentId = req.body.commentId as string;
    const liked = req.body.liked as boolean;
    try {
      if (!(await canInteractWithComment(userId, commentId))) {
        return res.sendStatus(403);
      }
      if (liked) {
        await likeComment(userId, commentId);
      } else {
        await dislikeComment(userId, commentId);
      }
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't like comment");
    }
  }
);

commentRouter.get(
  "/",
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("cursor").optional().isString(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const postId = req.query.postId as string;
    const cursor = req.query.cursor as string;
    try {
      if (!(await canInteractWithPost(userId, postId))) {
        return res.sendStatus(403);
      }
      const commentsPaging = await getComments(userId, postId, cursor);
      return res.status(200).json(commentsPaging);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't fetch comments");
    }
  }
);

commentRouter.get(
  "/replies",
  check("commentId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("cursor").optional().isString(),
  Validate,
  async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const commentId = req.query.commentId as string;
    const cursor = req.query.cursor as string;
    try {
      if (!(await canInteractWithComment(userId, commentId))) {
        return res.sendStatus(403);
      }
      const repliesPaging = await getReplies(userId, commentId, cursor);
      return res.status(200).json(repliesPaging);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't fetch replies");
    }
  }
);

export default commentRouter;
