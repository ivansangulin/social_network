import { Router, Request, Response } from "express";
import { getUserPosts } from "../services/PostService";

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

export default postRouter;
