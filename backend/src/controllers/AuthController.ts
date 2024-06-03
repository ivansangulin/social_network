import { Request, Response, Router } from "express";
import z from "zod";
import {
  findMyself,
  findUserByUsernameOrEmail,
  findUserDataFromUsername,
  registerUser,
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
  check("username").trim().notEmpty().withMessage("Username can't be empty"),
  check("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  check("password").trim().notEmpty().withMessage("Password can't be empty"),
  check("repeatedPassword")
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
  check("password").trim().notEmpty().withMessage("Password can't be empty"),
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
  check("username").isString().trim().notEmpty(),
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
          lockedProfile: userData.locked_profile,
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

export default userRouter;
