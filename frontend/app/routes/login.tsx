import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { zfd } from "zod-form-data";
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
  const fetcher = useFetcher();
  const actionMessage = fetcher.data as string | null;
  const [disabled, setDisabled] = useState<boolean>(true);

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
        <div className="text-4xl text-center mb-10">Log in</div>

        <label htmlFor="username" className="text-xl">
          Username / E-mail:
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
        />

        <button
          type="submit"
          className={`!mt-8 p-2 text-white text-xl bg-primary ${
            disabled ? "cursor-not-allowed" : "hover:bg-primary-dark"
          }`}
          disabled={disabled}
        >
          Log in
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
      </fetcher.Form>
    </div>
  );
};
