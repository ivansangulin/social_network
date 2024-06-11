import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { zfd } from "zod-form-data";
import { AnimatedDots } from "~/components/animated-dots";
import { getCookie } from "~/service/user";

const registrationSchema = zfd.formData({
  username: zfd.text(),
  email: zfd.text(),
  password: zfd.text(),
  repeatedPassword: zfd.text(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const registrationData = await registrationSchema.safeParse(formData);
  if (registrationData.success) {
    try {
      const registrationResponse = await fetch(
        `${process.env.BACKEND_URL}/user/register`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(registrationData.data),
        }
      );
      if (!registrationResponse.ok) {
        return json(await registrationResponse.text());
      }
      const cookie = registrationResponse.headers.get("set-cookie");
      if (cookie) {
        return redirect("/", { headers: { "Set-Cookie": cookie } });
      }
      return json("Failed to register!");
    } catch (err) {
      return json("Failed to register!");
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
  const fetcher = useFetcher();
  const actionMessage = fetcher.data as string | null;
  const [disabled, setDisabled] = useState<boolean>(true);
  const [password, setPassword] = useState<string>();
  const [repeatedPassword, setRepeatedPassword] = useState<string>();
  const passwordsEqual = password === repeatedPassword;

  useEffect(() => {
    if (fetcher.state === "submitting") {
      setDisabled(true);
    }
  }, [fetcher.state]);

  return (
    <div className="grow flex flex-col space-y-12 justify-start items-center">
      <fetcher.Form
        method="POST"
        className="flex flex-col space-y-2 px-32 py-20 rounded-xl drop-shadow-2xl relative"
        onChange={(e) => {
          const valid = e.currentTarget.checkValidity();
          if (valid === disabled) {
            setDisabled(!valid);
          }
        }}
      >
        <div className="text-4xl text-center mb-10">Registration</div>

        <label htmlFor="email" className="text-xl">
          E-mail:
        </label>
        <input
          className="rounded-lg min-w-96 min-h-12 px-4 border border-slate-300"
          type="email"
          name="email"
          required
        />

        <label htmlFor="username" className="text-xl">
          Username:
        </label>
        <input
          className="rounded-lg min-w-96 min-h-12 px-4 border border-slate-300"
          type="text"
          name="username"
          required
        />

        <label htmlFor="password" className="text-xl">
          Password:
        </label>
        <input
          className="rounded-lg min-w-96 min-h-12 px-4 border border-slate-300"
          type="password"
          name="password"
          required
          onChange={(e) => {
            e.preventDefault();
            setPassword(e.currentTarget.value);
          }}
        />

        <label htmlFor="repeatedPassword" className="text-xl">
          Repeated password:
        </label>
        <input
          className="rounded-lg min-w-96 min-h-12 px-4 border border-slate-300"
          type="password"
          name="repeatedPassword"
          required
          onChange={(e) => {
            e.preventDefault();
            setRepeatedPassword(e.currentTarget.value);
          }}
        />

        <div
          className={`text-red-500 invisible ${!passwordsEqual && "!visible"}`}
        >
          Passwords are not equal!
        </div>

        <button
          type="submit"
          className={`!mt-4 p-2 text-white text-xl bg-primary ${
            disabled || !passwordsEqual
              ? "cursor-not-allowed"
              : "hover:bg-primary-dark"
          }`}
          disabled={disabled || !passwordsEqual}
        >
          {fetcher.state == "submitting" ? (
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
          to={"/login"}
          className="!mt-8 text-blue-500 text-lg hover:underline"
        >
          {"Already have an account?"}
        </Link>
      </fetcher.Form>
    </div>
  );
};
