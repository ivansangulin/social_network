import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { searchUsers } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const params = new URL(request.url).searchParams;
    const search = z.string().parse(params.get("search"));
    const cursor = params.get("cursor");
    return await searchUsers(request, search, cursor);
  } catch (err) {
    console.log(err);
    return [];
  }
};
