import { Router, Request, Response } from "express";
import { check } from "express-validator";
import Validate from "../middleware/validate";
import { canInteractWithPost } from "../services/PostService";
import {
  canInteractWithComment,
  createComment,
  dislikeComment,
  likeComment,
} from "../services/CommentService";

const commentRouter = Router();

commentRouter.post(
  "/",
  check("postId").isString().trim().notEmpty(),
  check("text").isString().trim().notEmpty(),
  check("commentId").optional().isString(),
  Validate,
  async (req, res) => {
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
  check("commentId").isString().trim().notEmpty(),
  check("liked").isBoolean().notEmpty(),
  Validate,
  async (req, res) => {
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

export default commentRouter;
