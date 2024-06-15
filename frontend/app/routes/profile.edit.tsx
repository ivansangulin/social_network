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
  const [disabled, setDisabled] = useState<boolean>(false);
  const [username, setUsername] = useState<string>(user.username);
  const [email, setEmail] = useState<string>(user.email);
  const [checked, setChecked] = useState<boolean>(user.public_profile);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  return (
    <div className="grow flex flex-col justify-start items-center space-y-2">
      <div className="text-4xl text-center mb-8 mt-20">Edit profile data</div>

      <div className="w-2/12 bg-white rounded-lg flex justify-between items-center space-x-8 p-4">
        <div className="max-w-[100px]">
          <UploadProfilePictureDialog open={dialogOpen} />
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
        className="w-2/12 flex flex-col space-y-2 rounded-xl drop-shadow-2xl relative"
        onChange={(e) => {
          const valid = e.currentTarget.checkValidity();
          if (valid === disabled) {
            setDisabled(!valid);
          }
        }}
      >
        <label htmlFor="username" className="text-xl">
          Username
        </label>
        <input
          className="rounded-lg w-full min-h-12 px-4 border border-slate-300"
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
        />

        <label htmlFor="username" className="text-xl">
          E-mail
        </label>
        <input
          className="rounded-lg w-full min-h-12 px-4 border border-slate-300"
          type="text"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />

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
            disabled ? "cursor-not-allowed" : "hover:bg-primary-dark"
          }`}
          disabled={disabled}
        >
          {navigation.state !== "idle" ? (
            <div className="flex justify-center items-center">
              <AnimatedDots />
            </div>
          ) : (
            "Submit"
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
