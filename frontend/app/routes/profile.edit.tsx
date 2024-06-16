import { Field, Label, Switch } from "@headlessui/react";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { AnimatedDots } from "~/components/animated-dots";
import { UploadProfilePictureDialog } from "~/components/profile";
import { useUserData } from "~/hooks/useUserData";
import { editProfileData, editProfileDataSchema } from "~/service/user";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = editProfileDataSchema.safeParse(formData);
  if (data.success) {
    return await editProfileData(request, data.data);
  } else {
    return json({ error: "Data can't be empty!" });
  }
};

export default () => {
  const actionData = useActionData<typeof action>();
  const user = useUserData()!;
  const navigation = useNavigation();
  const [username, setUsername] = useState<string>(user.username);
  const [email, setEmail] = useState<string>(user.email);
  const [checked, setChecked] = useState<boolean>(user.public_profile);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const inputStyle =
    "rounded-lg min-h-12 px-4 border border-slate-300 w-full peer outline outline-1 outline-stone-200 border-none focus:outline-blue-500 transition-all duration-200";
  const labelStyle =
    "absolute top-1/2 -translate-y-1/2 left-4 text-lg pointer-events-none text-stone-500 bg-white transition-all duration-200 ease-in rounded-lg peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:px-2";

  return (
    <div className="grow flex flex-col justify-start items-center space-y-2">
      <div className="text-4xl text-center mb-8 mt-20">Edit profile data</div>

      <div className="w-2/12 min-w-96 bg-white rounded-lg flex justify-between items-center space-x-8 p-4">
        <div className="max-w-[100px]">
          <UploadProfilePictureDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </div>
        <button
          className="bg-primary rounded-lg text-white py-2 px-4 h-fit"
          onClick={() => setDialogOpen(!dialogOpen)}
        >
          Change photo
        </button>
      </div>
      <Form
        method="POST"
        className="w-2/12 min-w-96 flex flex-col space-y-2 rounded-xl relative"
      >
        <div className="relative w-full !mt-8">
          <input
            className={inputStyle}
            type="text"
            name="username"
            value={username}
            placeholder=""
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <label htmlFor="username" className={labelStyle}>
            Username
          </label>
        </div>

        <div className="relative w-full !mt-8">
          <input
            className={inputStyle}
            type="email"
            name="email"
            value={email}
            placeholder=""
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          <label htmlFor="email" className={labelStyle}>
            E-mail
          </label>
        </div>

        <Field className="pt-2 flex space-x-4 items-end">
          <Label className="text-xl">Public profile:</Label>
          <Switch
            checked={checked}
            onChange={setChecked}
            className="group inline-flex h-6 w-11 items-center rounded-full bg-red-500 transition data-[checked]:bg-primary"
          >
            <span className="size-4 translate-x-1 rounded-full bg-gray-200 transition group-data-[checked]:translate-x-6" />
          </Switch>
          <input
            name="public_profile"
            type="checkbox"
            className="hidden"
            checked={checked}
            onChange={(e) => setChecked(e.currentTarget.checked)}
          />
        </Field>

        <button
          type="submit"
          className={`!mt-8 p-2 text-white text-xl bg-primary ${
            navigation.state !== "idle"
              ? "cursor-not-allowed"
              : "hover:bg-primary-dark"
          }`}
          disabled={navigation.state !== "idle"}
        >
          {navigation.state !== "submitting" ? (
            "Submit"
          ) : (
            <div className="flex justify-center items-center">
              <AnimatedDots />
            </div>
          )}
        </button>

        <div
          className={`mt-2 text-center text-bold text-red-500 text-xl invisible ${
            actionData?.error && "!visible"
          }`}
        >
          {actionData?.error ?? "-"}
        </div>
      </Form>
    </div>
  );
};
