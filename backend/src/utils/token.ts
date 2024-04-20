import { User } from "@prisma/client";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const env = process.env;

export type Token = {
  token: string;
  cookieOptions: {
    maxAge: number;
    httpOnly: boolean;
    signed: boolean;
  };
};

export const getToken = (user: User): Token => {
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

  return { token, cookieOptions };
};
