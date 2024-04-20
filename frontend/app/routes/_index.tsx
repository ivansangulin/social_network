import {
  LoaderFunctionArgs,
  redirect,
  type MetaFunction,
} from "@remix-run/node";
import { me } from "~/util/user";

export const meta: MetaFunction = () => {
  return [{ title: "App" }, { name: "description", content: "My app" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await me(request);
  if (!user) {
    return redirect("/login");
  }
  return null;
};

export default function Index() {
  return <></>;
}
