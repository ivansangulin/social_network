import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { z } from "zod";
import {
  deleteProfilePicture,
  getCookie,
  uploadProfilePicture,
} from "~/service/user";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const cookie = getCookie(request);
    if (!cookie) {
      return redirect("/login");
    }
    if (request.method.toLocaleLowerCase() === "delete") {
      return await deleteProfilePicture(cookie);
    } else {
      const formData = await request.formData();
      const photo = z.instanceof(Blob).parse(formData.get("photo"));
      return await uploadProfilePicture(cookie, photo);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
