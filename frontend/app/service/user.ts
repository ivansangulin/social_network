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

const searchUserSchema = z.object({
  username: z.string(),
  profile_picture_uuid: z.string().nullish(),
});

const searchUsersPagingSchema = z.object({
  count: z.number(),
  users: z.array(searchUserSchema),
  cursor: z.string(),
});

export const editProfileDataSchema = zfd.formData({
  username: zfd.text(),
  email: zfd.text(),
  public_profile: zfd.checkbox(),
});

export const changePasswordDataSchema = zfd.formData({
  username: zfd.text(),
  currentPassword: zfd.text(),
  newPassword: zfd.text(),
  repeatedPassword: zfd.text(),
});

export type MyData = z.infer<typeof myDataSchema>;
export type UserData = z.infer<typeof userDataSchema>;
type EditProfileData = z.infer<typeof editProfileDataSchema>;
export type SearchUser = z.infer<typeof searchUserSchema>;
export type SearchUsersPaging = z.infer<typeof searchUsersPagingSchema>;
type ChangePasswordData = z.infer<typeof changePasswordDataSchema>;

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

export const searchUsers = async (
  request: Request,
  search: string,
  cursor: string | null
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return [];
    }
    const searchUsersResponse = await fetch(
      `${process.env.BACKEND_URL}/user/search?search=${search}${
        cursor ? `&cursor=${cursor}` : ""
      }`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!searchUsersResponse.ok) {
      return [];
    }
    const searchUsersPaging = searchUsersPagingSchema.parse(
      await searchUsersResponse.json()
    );
    return searchUsersPaging;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const changePassword = async (
  request: Request,
  data: ChangePasswordData
) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return json({ error: "Error occured while changing password!" });
    }
    const changePasswordResponse = await fetch(
      `${process.env.BACKEND_URL}/user/change-password`,
      {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    if (!changePasswordResponse.ok) {
      return json({ error: await changePasswordResponse.text() });
    }
    return redirect(`/profile/${data.username}/posts`);
  } catch (err) {
    console.log(err);
    return json({ error: "Error occured while changing password!" });
  }
};
