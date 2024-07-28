import { Request, Response, Router } from "express";
import z from "zod";
import {
  changePassword,
  changeProfilePicture,
  checkIfEmailExists,
  checkIfUsernameExists,
  checkMyPassword,
  deleteProfilePicture,
  editProfileData,
  findMyself,
  findUserByUsernameOrEmail,
  findUserDataFromUsername,
  registerUser,
  searchUsers,
} from "../services/UserService";
import { check, oneOf } from "express-validator";
import {
  RequiresAuth,
  validateUserLoginData,
  validateUserRegistrationData,
} from "../middleware/auth";
import Validate from "../middleware/validate";
import { getToken, Token } from "../utils/token";
import { areFriends } from "../services/FriendshipService";
import { isFriendRequestPending } from "../services/FriendRequestService";
import formidable from "formidable";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const userRouter = Router();

export const userRegistrationSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  repeatedPassword: z.string(),
});
export type UserRegistrationType = z.infer<typeof userRegistrationSchema>;

export const userLoginSchema = z.object({
  username: z.string().nullish(),
  email: z.string().nullish(),
  password: z.string(),
});
export type UserLoginType = z.infer<typeof userLoginSchema>;

userRouter.post(
  "/register",
  check("username")
    .exists({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Username can't be empty"),
  check("email")
    .exists({ values: "falsy" })
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  check("password")
    .exists({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Password can't be empty"),
  check("repeatedPassword")
    .exists({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Repeated password can't be empty"),
  Validate,
  validateUserRegistrationData,
  async (req: Request, res: Response) => {
    const userDto = req.body;
    try {
      const user = await registerUser(userDto);
      const tokenObj: Token = getToken(user);
      res.cookie("session", tokenObj.token, tokenObj.cookieOptions);
      return res.status(200).send("Successfully registered!");
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't create user!");
    }
  }
);

userRouter.post(
  "/login",
  check("password")
    .exists({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Password can't be empty"),
  oneOf(
    [
      check("email")
        .trim()
        .notEmpty()
        .isEmail()
        .withMessage("Enter a valid email"),
      check("username")
        .trim()
        .notEmpty()
        .withMessage("Username can't be empty"),
    ],
    { message: "Either username or email must be provided" }
  ),
  Validate,
  validateUserLoginData,
  async (req: Request, res: Response) => {
    const loginData = await userLoginSchema.parse(req.body);
    try {
      const user = await findUserByUsernameOrEmail(
        loginData.email ?? loginData.username!
      );
      const tokenObj: Token = getToken(user);
      res.cookie("session", tokenObj.token, tokenObj.cookieOptions);
      return res.status(200).send("Successfully logged in");
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error occured logging in");
    }
  }
);

userRouter.get("/me", RequiresAuth, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.sendStatus(401);
  }
  try {
    const user = await findMyself(userId);
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error occured fetching data!");
  }
});

userRouter.get(
  "/user-data",
  RequiresAuth,
  check("username").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    const myId = req.userId as string;
    const username = req.query.username as string;
    try {
      const userData = await findUserDataFromUsername(username);
      if (!userData) {
        return res.status(404).send("User not found!");
      }
      const [friends, friendRequest] = await Promise.all([
        areFriends(myId, userData.id),
        isFriendRequestPending(myId, userData.id),
      ]);
      return res.status(200).send({
        areFriends: friends,
        user: {
          id: userData.id,
          username: username,
          public_profile: userData.public_profile,
          profilePictureUuid: userData.profile_picture_uuid,
        },
        friendRequestSenderId: friendRequest
          ? friendRequest.from_user_id
          : undefined,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error occured fetching user data!");
    }
  }
);

userRouter.post(
  "/upload-profile-picture",
  RequiresAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const maxFileSize = 8 * 1024 * 1024;
      const allowedExtensions = [".jpg", ".jpeg", ".png"];
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
      const form = formidable({
        uploadDir: path.join(__dirname, "../../public/image/profile_picture"),
        keepExtensions: true,
        maxFileSize: maxFileSize,
        maxFiles: 1,
      });
      const [_, files] = await form.parse(req);
      const file = files.photo instanceof Array ? files.photo[0] : files.photo;
      if (!file) {
        return res.status(400).send("No file uploaded");
      }
      const extension = path.extname(file.originalFilename ?? "").toLowerCase();
      const mimeType = file.mimetype;
      const oldPath = file.filepath;

      if (
        !allowedExtensions.includes(extension) ||
        !mimeType ||
        !allowedMimeTypes.includes(mimeType)
      ) {
        fs.unlinkSync(oldPath);
        return res.status(400).json({
          error: "Invalid file type. Only .jpg, .jpeg, and .png are allowed.",
        });
      }
      const newFileName = uuidv4() + extension;
      const newPath = path.join(__dirname, "../../public/image/profile_picture", newFileName);
      fs.rename(oldPath, newPath, async (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save file" });
        }
        await changeProfilePicture(userId, newFileName);
        return res.json({
          message: "File uploaded successfully",
          filePath: newPath,
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't upload profile picture");
    }
  }
);

userRouter.delete(
  "/delete-profile-picture",
  RequiresAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const { profile_picture_uuid } = await findMyself(userId);
      if (profile_picture_uuid) {
        fs.unlinkSync(
          path.join(__dirname, "../../public/image/profile_picture", profile_picture_uuid)
        );
        await deleteProfilePicture(userId);
      }
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Error occured deleting profile picture");
    }
  }
);

userRouter.post(
  "/edit",
  RequiresAuth,
  check("username").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("email").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("public_profile").exists({ values: "null" }).isBoolean(),
  Validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const username = req.body.username as string;
      const email = req.body.email as string;
      const public_profile = req.body.public_profile as boolean;
      const me = await findMyself(userId);
      if (me.username !== username && (await checkIfUsernameExists(username))) {
        return res.status(400).send("Username already exists");
      }
      if (me.email !== email && (await checkIfEmailExists(email))) {
        return res.status(400).send("Email already exists");
      }
      await editProfileData(userId, username, email, public_profile);
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't edit profile data!");
    }
  }
);

userRouter.get(
  "/search",
  RequiresAuth,
  check("cursor").isString().trim().notEmpty().optional(),
  check("search").exists({ values: "falsy" }).isString().trim().notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const cursor = req.query.cursor as string | undefined;
      const search = req.query.search as string;
      const usersPaging = await searchUsers(userId, cursor, search);
      return res.status(200).json(usersPaging);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't fetch users");
    }
  }
);

userRouter.post(
  "/change-password",
  RequiresAuth,
  check("currentPassword")
    .exists({ values: "falsy" })
    .isString()
    .trim()
    .notEmpty(),
  check("newPassword").exists({ values: "falsy" }).isString().trim().notEmpty(),
  check("repeatedPassword")
    .exists({ values: "falsy" })
    .isString()
    .trim()
    .notEmpty(),
  Validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const currentPassword = req.body.currentPassword as string;
      const newPassword = req.body.newPassword as string;
      const repeatedPassword = req.body.repeatedPassword as string;
      if (newPassword !== repeatedPassword) {
        return res
          .status(400)
          .send("New password and repeated password must be the same!");
      }
      if (currentPassword === newPassword) {
        return res
          .status(400)
          .send("New password can't be the same as the old one!");
      }
      if (!(await checkMyPassword(userId, currentPassword))) {
        return res.status(400).send("Wrong password!");
      }
      await changePassword(userId, newPassword);
      return res.sendStatus(200);
    } catch (err) {
      console.log(err);
      return res.status(500).send("Couldn't change password!");
    }
  }
);

export default userRouter;
