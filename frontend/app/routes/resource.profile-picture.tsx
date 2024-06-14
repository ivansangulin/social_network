import { ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { deleteProfilePicture, uploadProfilePicture } from "~/service/user";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method.toLocaleLowerCase() === "delete") {
      return await deleteProfilePicture(request);
    } else {
      const formData = await request.formData();
      const photo = z.instanceof(Blob).parse(formData.get("photo"));
      return await uploadProfilePicture(request, photo);
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
