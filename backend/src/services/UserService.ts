import { UserRegistrationType } from "../controllers/AuthController";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { prisma } from "../utils/client";

const saltRounds = 5;

export const registerUser = async (userDto: UserRegistrationType) => {
  const hashedPassword: string = bcrypt.hashSync(userDto.password, saltRounds);
  userDto.password = hashedPassword;
  const user = await prisma.user.create({
    data: {
      username: userDto.username,
      email: userDto.email,
      password: userDto.password,
      locked_profile: true,
      uuid: randomUUID(),
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
    select: { email: true, username: true, profile_picture_uuid: true },
  });
  return user;
};

export const findUserUuidById = async (id: number) => {
  const { uuid: userUuid } = await prisma.user.findFirstOrThrow({
    select: {
      uuid: true,
    },
    where: {
      id: id,
    },
  });

  return userUuid;
};

export const findFriendIdFromUuid = async (friendUuid: string) => {
  const { id: friendId } = await prisma.user.findUniqueOrThrow({
    select: {
      id: true,
    },
    where: {
      uuid: friendUuid,
    },
  });
  return friendId;
};

export const myMessagingData = async (userId: number) => {
  const data = await prisma.user.findFirstOrThrow({
    select: {
      uuid: true,
      username: true,
      profile_picture_uuid: true,
      user_status: {
        select: {
          is_online: true,
          last_active: true,
        },
      },
    },
    where: {
      id: userId,
    },
  });

  return data;
};

export const updateStatus = async (userId: number, status: boolean) => {
  await prisma.userStatus.update({
    data: {
      is_online: status,
    },
    where: {
      user_id: userId,
    },
  });
};

export const findUserDataFromUsername = async (username: string) => {
  const userData = await prisma.user.findFirst({
    select: {
      id: true,
      locked_profile: true,
      profile_picture_uuid: true,
    },
    where: {
      username: username,
    },
  });

  return userData;
};
