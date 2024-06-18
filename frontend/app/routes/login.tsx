import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { zfd } from "zod-form-data";
import { AnimatedDots } from "~/components/animated-dots";
import { getCookie } from "~/service/user";

const loginSchema = zfd.formData({
  username: zfd.text(),
  password: zfd.text(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const loginData = await loginSchema.safeParse(formData);
  if (loginData.success) {
    try {
      const loginResponse = await fetch(
        `${process.env.BACKEND_URL}/user/login`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(loginData.data),
        }
      );
      if (!loginResponse.ok) {
        return json(await loginResponse.text());
      }
      const cookie = loginResponse.headers.get("set-cookie");
      if (cookie) {
        return redirect("/", { headers: { "Set-Cookie": cookie } });
      }
      return json("Failed to login!");
    } catch (err) {
      return json("Failed to login!");
    }
  }
  return json("Data can't be empty!");
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const sessionCookie = getCookie(request);
  if (sessionCookie) {
    return new Response("", {
      headers: {
        "Set-Cookie": `${sessionCookie}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      },
    });
  }
  return null;
};

export default () => {
  const navigation = useNavigation();
  const actionMessage = useActionData<typeof action>();
  const inputStyle =
    "rounded-lg min-h-12 px-4 border border-slate-300 w-full peer outline outline-1 outline-stone-200 border-none focus:outline-blue-500 transition-all duration-200";
  const labelStyle =
    "absolute top-1/2 -translate-y-1/2 left-4 text-lg pointer-events-none text-stone-500 bg-white transition-all duration-200 ease-in rounded-lg peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:px-2";

  return (
    <div className="grow flex flex-col space-y-12 items-center">
      <Form
        method="POST"
        className="w-2/12 min-w-96 flex flex-col space-y-2 py-20"
      >
        <div className="text-4xl text-center mb-10">Log in</div>

        <div className="relative w-full">
          <input
            className={inputStyle}
            type="text"
            name="username"
            placeholder=""
            required
          />
          <label htmlFor="username" className={labelStyle}>
            Username / E-mail
          </label>
        </div>

        <div className="relative w-full !mt-8">
          <input
            className={inputStyle}
            type="password"
            name="password"
            placeholder=""
            required
          />
          <label htmlFor="password" className={labelStyle}>
            Password
          </label>
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
          {navigation.state !== "idle" ? (
            <div className="flex justify-center items-center">
              <AnimatedDots />
            </div>
          ) : (
            "Log in"
          )}
        </button>

        <div
          className={`mt-2 text-center text-bold text-red-500 text-xl invisible ${
            actionMessage && "!visible"
          }`}
        >
          {actionMessage ?? "-"}
        </div>

        <Link
          to={"/register"}
          className="!mt-8 text-blue-500 text-lg hover:underline"
        >
          {"Don't have an account?"}
        </Link>
      </Form>
    </div>
  );
};
