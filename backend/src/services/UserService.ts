import { PrismaClient } from "@prisma/client";
import { UserRegistrationType } from "../controllers/AuthController";
import bcrypt from "bcrypt";

const saltRounds = 5;
const prisma = new PrismaClient();

export const registerUser = async (userDto: UserRegistrationType) => {
  const hashedPassword: string = bcrypt.hashSync(userDto.password, saltRounds);
  userDto.password = hashedPassword;
  const user = await prisma.user.create({
    data: {
      username: userDto.username,
      email: userDto.email,
      password: userDto.password,
      locked_profile: true,
    },
  });
  return user;
};

export const checkIfEmailExists = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email: email } });
  return user ? true : false;
};

export const checkIfUsernameExists = async (username: string) => {
  const user = await prisma.user.findFirst({ where: { username: username } });
  return user ? true : false;
};

export const checkPassword = async (auth: string, password: string) => {
  try {
    const obj = await prisma.user.findFirstOrThrow({
      where: { OR: [{ username: auth }, { email: auth }] },
      select: { password: true },
    });
    return bcrypt.compareSync(password, obj.password);
  } catch (err) {
    return false;
  }
};

export const findUserByUsernameOrEmail = async (auth: string) => {
  const user = await prisma.user.findFirstOrThrow({
    where: { OR: [{ username: auth }, { email: auth }] },
  });
  return user;
};

export const findMyself = async (id: number) => {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: id },
    select: { email: true, username: true },
  });
  return user;
};
