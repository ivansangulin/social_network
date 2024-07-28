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
  deletePost,
  isOwnerOfPost,
  editPost,
  createPost,
} from "../services/PostService";
import { check } from "express-validator";
import Validate from "../middleware/validate";
import { areFriends } from "../services/FriendshipService";
import { findUserDataFromUsername } from "../services/UserService";
import formidable from "formidable";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

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

postRouter.delete(
  "/delete",
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const postId = req.body.postId as string;
    try {
      if (!(await isOwnerOfPost(userId, postId))) {
        return res.sendStatus(403);
      }
      await deletePost(postId);
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't delete post!");
    }
  }
);

postRouter.patch(
  "/edit",
  check("postId").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("text").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req, res) => {
    const userId = req.userId as string;
    const postId = req.body.postId as string;
    const text = req.body.text as string;
    try {
      if (!(await isOwnerOfPost(userId, postId))) {
        return res.sendStatus(403);
      }
      await editPost(postId, text);
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't edit post!");
    }
  }
);

postRouter.post("/create", async (req, res) => {
  try {
    const userId = req.userId as string;
    const maxFileSize = 8 * 1024 * 1024;
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    const form = formidable({
      uploadDir: path.join(__dirname, "../../public/image/post"),
      keepExtensions: true,
      maxFileSize: maxFileSize,
      maxFiles: 6,
    });
    const [fields, files] = await form.parse(req);
    if (!fields.text) {
      return res.status(400).send("Text can't be empty!");
    }
    const text = fields.text![0];
    const uploadedFiles: string[] = [];
    if (files.photos) {
      for (const file of files.photos) {
        const extension = path
          .extname(file.originalFilename ?? "")
          .toLowerCase();
        const mimeType = file.mimetype;
        const oldPath = file.filepath;
        if (
          !allowedExtensions.includes(extension) ||
          !mimeType ||
          !allowedMimeTypes.includes(mimeType)
        ) {
          fs.unlinkSync(oldPath);
          for (const file of uploadedFiles) {
            fs.unlinkSync(path.join(__dirname, "../../public/image/post", file));
          }
          return res
            .status(400)
            .send("Invalid file type. Only .jpg, .jpeg, and .png are allowed.");
        }
        const newFileName = uuidv4() + extension;
        const newPath = path.join(__dirname, "../../public/image/post", newFileName);
        try {
          fs.renameSync(oldPath, newPath);
        } catch (err) {
          console.log(err);
          for (const file of uploadedFiles) {
            fs.unlinkSync(path.join(__dirname, "../../public/image/post", file));
          }
          throw Error(
            `Error occured renaming file ${file.originalFilename} to ${newFileName}`
          );
        }
        uploadedFiles.push(newFileName);
      }
    }
    const { post } = await createPost(userId, text, uploadedFiles);
    return res.status(200).json(post);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Couldn't create new post!");
  }
});

export default postRouter;
