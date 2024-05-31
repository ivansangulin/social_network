import { z } from "zod";

const myDataSchema = z.object({
  username: z.string(),
  email: z.string(),
  profile_picture_uuid: z.string().nullish(),
});

const userDataSchema = z.object({
  areFriends: z.boolean(),
  user: z.object({
    username: z.string(),
    lockedProfile: z.boolean(),
    profilePictureUuid: z.string().nullish(),
  }),
  friendRequestIsPending: z.boolean(),
});

export type MyData = z.infer<typeof myDataSchema>;
export type UserData = z.infer<typeof userDataSchema>;

export const me = async (request: Request) => {
  const cookie = getCookie(request);
  const url = new URL(request.url);
  if (
    !cookie ||
    url.pathname.includes("/login") ||
    url.pathname.includes("/register")
  ) {
    return null;
  }
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/user/me`, {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
    });
    const data = myDataSchema.parse(await response.json());
    return data;
  } catch (err) {
    return null;
  }
};

export const getCookie = (request: Request): string | undefined => {
  return request.headers
    .get("Cookie")
    ?.split(";")
    .filter((c) => c.includes("session"))[0];
};

export type ErrorType = {
  status: number;
  errorMessage: string;
};

export const getUserProfileData = async (
  request: Request,
  username: string
) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return {
      error: {
        status: 500,
        errorMessage: "Error occured fetching user data!",
      },
    };
  }
  try {
    const userDataResponse = await fetch(
      `${process.env.BACKEND_URL}/user/user-data?username=${username}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!userDataResponse.ok) {
      const errorMessage = await userDataResponse.text();
      if (userDataResponse.status === 404) {
        return { error: { status: 404, errorMessage } };
      }
      return { error: { status: 500, errorMessage } };
    }
    const userData = await userDataSchema.parse(await userDataResponse.json());
    return { error: null, userData };
  } catch (err) {
    console.log(err);
    return {
      error: {
        status: 500,
        errorMessage: "Error occured fetching user data!",
      },
    };
  }
};
