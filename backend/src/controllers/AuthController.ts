import { Request, Response, Router } from "express";
import z from "zod";
import {
  findUserByUsernameOrEmail,
  registerUser,
} from "../services/UserService";
import { check } from "express-validator";
import {
  validateUserLoginData,
  validateUserRegistrationData,
} from "../middleware/auth";
import Validate from "../middleware/validate";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const env = process.env;

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
  check("username").notEmpty().withMessage("Username can't be empty").trim(),
  check("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  check("password").notEmpty().withMessage("Password can't be empty").trim(),
  check("repeatedPassword")
    .notEmpty()
    .withMessage("Repeated password can't be empty")
    .trim(),
  Validate,
  validateUserRegistrationData,
  async (req: Request, res: Response) => {
    const userDto = req.body;
    try {
      await registerUser(userDto);
      return res.sendStatus(200);
    } catch (err) {
      return res.status(400).send("Couldn't create user!");
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
      const tokenObj = {
        id: user.id,
      };
      const cookieOptions = {
        maxAge: 20 * 60 * 10000,
        httpOnly: true,
        signed: true,
      };
      const token = jwt.sign(tokenObj, env.SECRET_ACCESS_TOKEN!, {
        expiresIn: "200m",
      });
      res.cookie("session", token, cookieOptions);
      res.status(200).send("Successfully logged in");
    } catch (err) {
      return res.status(500).send("Error occured logging in");
    }
  }
);

export default userRouter;