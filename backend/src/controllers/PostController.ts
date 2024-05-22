import { Router, Request, Response } from "express";
import { createPost, getUserPosts } from "../services/PostService";
import { check } from "express-validator";
import Validate from "../middleware/validate";

const postRouter = Router();

postRouter.get("/my-posts", async (req: Request, res: Response) => {
  const userId = req.userId;
  const cursor =
    typeof req.query.cursor === "string" ? Number(req.query.cursor) : undefined;

  try {
    const userPostPaging = await getUserPosts(Number(userId), cursor);
    return res.status(200).json(userPostPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching user posts!");
  }
});

postRouter.post(
  "/create",
  check("text")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Post text can't be empty!"),
  Validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const text = req.body.text as string;
      const post = await createPost(Number(userId), text);
      return res.status(200).json(post);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't create post!");
    }
  }
);

export default postRouter;
