import { Router, Request, Response } from "express";
import { getMainPagePosts, getUserPosts } from "../services/PostService";

const postRouter = Router();

postRouter.get("/my-posts", async (req: Request, res: Response) => {
  const userId = Number(req.userId);
  const cursor =
    typeof req.query.cursor === "string" ? Number(req.query.cursor) : undefined;

  try {
    const userPostPaging = await getUserPosts(userId, cursor);
    return res.status(200).json(userPostPaging);
  } catch (err) {
    return res.status(500).send("Error occured fetching user posts!");
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

export default postRouter;
