import { json, redirect } from "@remix-run/node";
import { z } from "zod";
import { zfd } from "zod-form-data";

const myDataSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  profile_picture_uuid: z.string().nullish(),
  public_profile: z.boolean(),
});

const userDataSchema = z.object({
  areFriends: z.boolean(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    public_profile: z.boolean(),
    profilePictureUuid: z.string().nullish(),
  }),
  friendRequestSenderId: z.string().nullish(),
});

export const editProfileDataSchema = zfd.formData({
  username: zfd.text(),
  email: zfd.text(),
  public_profile: zfd.checkbox(),
});

export type MyData = z.infer<typeof myDataSchema>;
export type UserData = z.infer<typeof userDataSchema>;
type EditProfileData = z.infer<typeof editProfileDataSchema>;

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

export const deleteProfilePicture = async (request: Request) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
    const deleteProfilePictureResponse = await fetch(
      `${process.env.BACKEND_URL}/user/delete-profile-picture`,
      {
        method: "DELETE",
        headers: {
          Cookie: cookie,
        },
      }
    );
    return deleteProfilePictureResponse.ok;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const uploadProfilePicture = async (request: Request, photo: Blob) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return false;
    }
    const extension = photo.type.split("/")[1];
    const file = new File([photo], `photo.${extension}`, { type: photo.type });
    const formData = new FormData();
    formData.append("photo", file);
    const uploadProfilePictureResponse = await fetch(
      `${process.env.BACKEND_URL}/user/upload-profile-picture`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
        },
        body: formData,
      }
    );
    return uploadProfilePictureResponse.ok;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const editProfileData = async (
  request: Request,
  data: EditProfileData
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return json({ error: "Error occured editing data!" });
    }
    const editProfileDataResponse = await fetch(
      `${process.env.BACKEND_URL}/user/edit`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (!editProfileDataResponse.ok) {
      return json({ error: await editProfileDataResponse.text() });
    }
    return redirect(`/profile/${data.username}/posts`);
  } catch (err) {
    console.log(err);
    return json({ error: "Error occured editing data!" });
  }
};
