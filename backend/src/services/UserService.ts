import { UserRegistrationType } from "../controllers/UserController";
import bcrypt from "bcrypt";
import { prisma } from "../utils/client";

const saltRounds = 5;

export const registerUser = async (userDto: UserRegistrationType) => {
  const hashedPassword: string = bcrypt.hashSync(userDto.password, saltRounds);
  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: userDto.username,
        email: userDto.email,
        password: hashedPassword,
        public_profile: false,
      },
    });
    await tx.userStatus.create({
      data: {
        user_id: user.id,
      },
    });
    return user;
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

export const findMyself = async (id: string) => {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: id },
    select: {
      id: true,
      email: true,
      username: true,
      profile_picture_uuid: true,
      public_profile: true,
    },
  });
  return user;
};

export const myMessagingData = async (userId: string) => {
  const data = await prisma.user.findFirstOrThrow({
    select: {
      id: true,
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

export const updateStatus = async (userId: string, status: boolean) => {
  try {
    await prisma.userStatus.upsert({
      create: {
        user_id: userId,
      },
      update: {
        is_online: status,
      },
      where: {
        user_id: userId,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

export const findUserDataFromUsername = async (username: string) => {
  const userData = await prisma.user.findFirst({
    select: {
      id: true,
      public_profile: true,
      profile_picture_uuid: true,
    },
    where: {
      username: username,
    },
  });

  return userData;
};

export const changeProfilePicture = async (
  userId: string,
  fileName: string
) => {
  await prisma.user.update({
    data: {
      profile_picture_uuid: fileName,
    },
    where: {
      id: userId,
    },
  });
};

export const deleteProfilePicture = async (userId: string) => {
  await prisma.user.update({
    data: {
      profile_picture_uuid: null,
    },
    where: {
      id: userId,
    },
  });
};

export const editProfileData = async (
  userId: string,
  username: string,
  email: string,
  public_profile: boolean
) => {
  await prisma.user.update({
    data: {
      username: username,
      email: email,
      public_profile: public_profile,
    },
    where: {
      id: userId,
    },
  });
};

export const searchUsers = async (
  userId: string,
  cursor: string | undefined,
  search: string
) => {
  const [count, users] = await Promise.all([
    prisma.user.count({
      where: {
        username: {
          contains: `${search.toLowerCase()}`,
          mode: "insensitive",
        },
      },
    }),
    prisma.user.findMany({
      take: 30,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { username: cursor } : undefined,
      select: {
        username: true,
        profile_picture_uuid: true,
      },
      where: {
        username: {
          contains: `${search.toLowerCase()}`,
          mode: "insensitive",
        },
        NOT: { id: userId },
      },
      orderBy: { username: "asc" },
    }),
  ]);

  return {
    count,
    users,
    cursor: users.length > 0 ? users[users.length - 1].username : "",
  };
};

export const changePassword = async (userId: string, newPassword: string) => {
  const hashedPassword: string = bcrypt.hashSync(newPassword, saltRounds);
  await prisma.user.update({
    data: {
      password: hashedPassword,
    },
    where: {
      id: userId,
    },
  });
};

export const checkMyPassword = async (userId: string, password: string) => {
  const { password: dbPassword } = await prisma.user.findUniqueOrThrow({
    select: {
      password: true,
    },
    where: {
      id: userId,
    },
  });
  return bcrypt.compareSync(password, dbPassword);
};
