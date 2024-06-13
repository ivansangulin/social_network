import { z } from "zod";
import { getCookie } from "./user";

export const friendSchema = z.object({
  username: z.string(),
  id: z.string(),
  profile_picture_uuid: z.string().nullish(),
  user_status: z
    .object({
      is_online: z.boolean(),
      last_seen: z.string(),
    })
    .nullish(),
});
export const friendsPagingSchema = z.object({
  count: z.number(),
  cursor: z.string(),
  friends: z.array(friendSchema),
});

export type FriendsPagingType = z.infer<typeof friendsPagingSchema>;
export type Friend = z.infer<typeof friendSchema>;

export const getMyFriends = async (
  request: Request,
  cursor: string | null,
  search: string | null
) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const friendsResponse = await fetch(
      `${process.env.BACKEND_URL}/friendship/my-friends?cursor=${
        cursor ?? ""
      }${`&search=${search ?? ""}`}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!friendsResponse.ok) {
      return null;
    }
    const friendsPaging = await friendsPagingSchema.parse(
      await friendsResponse.json()
    );
    return friendsPaging;
  } catch (err) {
    return null;
  }
};

export const getUserFriends = async (
  request: Request,
  username: string,
  cursor: string | null,
  search: string | null
) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const friendsResponse = await fetch(
      `${
        process.env.BACKEND_URL
      }/friendship/user-friends?username=${username}&cursor=${
        cursor ?? ""
      }${`&search=${search ?? ""}`}`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      }
    );
    if (!friendsResponse.ok) {
      return null;
    }
    const friendsPaging = await friendsPagingSchema.parse(
      await friendsResponse.json()
    );
    return friendsPaging;
  } catch (err) {
    console.log(err);
    return null;
  }
};
