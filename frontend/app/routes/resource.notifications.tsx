import { LoaderFunctionArgs } from "@remix-run/node";
import { findMyNotifications } from "~/service/notifications";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    return await findMyNotifications(request);
  } catch (err) {
    console.log(err);
    return null;
  }
};
