import { Request, Response, NextFunction } from "express";
import {
  userLoginSchema,
  userRegistrationSchema,
} from "../controllers/UserController";
import {
  checkIfEmailExists,
  checkIfUsernameExists,
  checkPassword,
} from "../services/UserService";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { ISocket } from "../app";
import { unescape } from "querystring";

dotenv.config();
const env = process.env;

export const validateUserRegistrationData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error occured while registering!");
  }
};

export const validateUserLoginData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
          return res.status(401).send("Wrong login data");
        }
      } else {
        return res.status(400).send("Wrong login data");
      }
    } else {
      return res.status(400).send("Bad user data");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error occured while logging in!");
  }
};

export const RequiresAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookie: string | undefined = req.signedCookies.session;
    if (!cookie) {
      return res.sendStatus(401);
    }
    const secret: string | undefined = env.SECRET_ACCESS_TOKEN;
    if (!secret) {
      throw new Error();
    }
    jwt.verify(cookie, secret, async (err, decoded) => {
      if (err) {
        return res.status(401).send("Session expired");
      }
      const token = decoded as JwtPayload;
      const { id } = token;
      req.userId = id;
    });
    next();
  } catch (err) {
    return res.status(500).send("Error occured verifying session");
  }
};

export const SocketAuth = async (socket: ISocket, next: any) => {
  try {
    const signedCookies = socket.handshake.headers.cookie?.split("=")[1];
    if (!signedCookies) {
      throw new Error("No cookies");
    }
    const decodedCookie = unescape(signedCookies);
    const cookie = cookieParser.signedCookie(
      decodedCookie,
      env.SECRET_ACCESS_TOKEN ?? ""
    );
    if (!cookie) {
      throw new Error("Unauthorized");
    }
    const secret: string | undefined = env.SECRET_ACCESS_TOKEN;
    if (!secret) {
      throw new Error();
    }
    const decoded = jwt.verify(cookie, secret);
    const token = decoded as JwtPayload;
    const { id } = token;
    socket.userId = id;
    next();
  } catch (err) {
    next(err);
  }
};
