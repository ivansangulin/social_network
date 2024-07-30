import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { findMyNotifications } from "~/service/notifications";
import { getCookie } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    return await findMyNotifications(cookie);
  } catch (err) {
    console.log(err);
    return null;
  }
};
