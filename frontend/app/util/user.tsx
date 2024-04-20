import { z } from "zod";

const userDataSchema = z.object({
  username: z.string(),
  email: z.string(),
});

export const me = async (request: Request) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return null;
  }
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/user/me`, {
      method: "GET",
      headers: {
        Cookie: cookie,
      },
    });
    const data = userDataSchema.parse(await response.json());
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
