import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import { getCookie, searchUsers } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    const params = new URL(request.url).searchParams;
    const search = z.string().parse(params.get("search"));
    const cursor = params.get("cursor");
    return await searchUsers(cookie, search, cursor);
  } catch (err) {
    console.log(err);
    return [];
  }
};
