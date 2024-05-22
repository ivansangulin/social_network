import { Request, Response, Router } from "express";
import z from "zod";
import {
  findMyself,
  findUserByUsernameOrEmail,
  registerUser,
} from "../services/UserService";
import { check } from "express-validator";
import {
  RequiresAuth,
  validateUserLoginData,
  validateUserRegistrationData,
} from "../middleware/auth";
import Validate from "../middleware/validate";
import { getToken, Token } from "../utils/token";

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
      return res.status(500).send("Couldn't create user!");
    }
  }
);

userRouter.post(
  "/login",
  check("password").notEmpty().trim().withMessage("Password can't be empty"),
  check("email").optional().trim().isEmail().withMessage("Enter a valid email"),
  check("username").optional().trim(),
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
    const user = await findMyself(Number(userId));
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).send("Error occured fetching data!");
  }
});

export default userRouter;
