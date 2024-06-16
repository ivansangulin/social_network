import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { AnimatedDots } from "~/components/animated-dots";
import { useUserData } from "~/hooks/useUserData";
import { changePassword, changePasswordDataSchema } from "~/service/user";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = changePasswordDataSchema.safeParse(formData);
  if (data.success) {
    return await changePassword(request, data.data);
  } else {
    return json({ error: "Data can't be empty!" });
  }
};

export default () => {
  const actionData = useActionData<typeof action>();
  const user = useUserData()!;
  const navigation = useNavigation();
  const [newPassword, setNewPassword] = useState<string>("");
  const [repeatedPassword, setRepeatedPassword] = useState<string>("");
  const passwordsEqual = newPassword === repeatedPassword;
  const inputStyle =
    "rounded-lg min-h-12 px-4 border border-slate-300 w-full peer outline outline-1 outline-stone-200 border-none focus:outline-blue-500 transition-all duration-200";
  const labelStyle =
    "absolute top-1/2 -translate-y-1/2 left-4 text-lg pointer-events-none text-stone-500 bg-white transition-all duration-200 ease-in rounded-lg peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:px-2";

  return (
    <div className="grow flex flex-col justify-start items-center space-y-2">
      <div className="text-4xl text-center mb-8 mt-20">Change password</div>
      <Form
        method="POST"
        className="w-2/12 min-w-96 flex flex-col space-y-2 rounded-xl relative"
      >
        <input type="hidden" name="username" defaultValue={user.username} />

        <div className="relative w-full !mt-8">
          <input
            className={inputStyle}
            type="password"
            name="currentPassword"
            placeholder=""
            required
          />
          <label htmlFor="currentPassword" className={labelStyle}>
            Current password
          </label>
        </div>

        <div className="relative w-full !mt-8">
          <input
            className={inputStyle}
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            placeholder=""
            required
          />
          <label htmlFor="newPassword" className={labelStyle}>
            New password
          </label>
        </div>

        <div className="relative w-full !mt-8">
          <input
            className={inputStyle}
            type="password"
            name="repeatedPassword"
            value={repeatedPassword}
            onChange={(e) => setRepeatedPassword(e.currentTarget.value)}
            placeholder=""
            required
          />
          <label htmlFor="repeatedPassword" className={labelStyle}>
            Repeated new password
          </label>
        </div>

        <div
          className={`text-red-500 invisible ${!passwordsEqual && "!visible"}`}
        >
          Passwords are not equal!
        </div>

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

        {!!actionData?.error && (
          <div className="mt-2 text-center text-bold text-red-500 text-xl">
            {actionData?.error}
          </div>
        )}
      </Form>
    </div>
  );
};
