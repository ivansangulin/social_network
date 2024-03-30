import { NextFunction, Request, Response, Router } from "express";
import z from "zod";
import {
  checkIfEmailExists,
  checkIfUsernameExists,
  registerUser,
} from "../services/UserService";

const userRouter = Router();

const userRegistrationSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  repeatedPassword: z.string(),
});
export type UserRegistrationType = z.infer<typeof userRegistrationSchema>;

const validateUserRegistrationData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = userRegistrationSchema.safeParse(req.body);
  if (user.success) {
    if (await checkIfEmailExists(user.data.email)) {
      return res.status(400).send("Email is already registered");
    } else if (await checkIfUsernameExists(user.data.username)) {
      return res.status(400).send("Username is already registered");
    } else if (user.data.password !== user.data.repeatedPassword) {
      return res
        .status(400)
        .send("Password and repeated password are not equal");
    }
    next();
  } else {
    return res.status(400).send("Bad user data");
  }
};

userRouter.post(
  "/register",
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

export default userRouter;
