import { Request, Response, NextFunction } from "express";
import {
  userLoginSchema,
  userRegistrationSchema,
} from "../controllers/AuthController";
import {
  checkIfEmailExists,
  checkIfUsernameExists,
  checkPassword,
} from "../services/UserService";

export const validateUserRegistrationData = async (
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

export const validateUserLoginData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const loginUserData = await userLoginSchema.safeParse(req.body);
  if (loginUserData.success) {
    if (
      (loginUserData.data.email &&
        (await checkIfEmailExists(loginUserData.data.email))) ||
      (loginUserData.data.username &&
        (await checkIfUsernameExists(loginUserData.data.username)))
    ) {
      if (
        await checkPassword(
          loginUserData.data.email ?? loginUserData.data.username!,
          loginUserData.data.password
        )
      ) {
        next();
      } else {
        return res.send(401).send("Wrong login data");
      }
    } else {
      return res.status(400).send("Wrong login data");
    }
  } else {
    return res.status(400).send("Bad user data");
  }
};
