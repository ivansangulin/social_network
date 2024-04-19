import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "App" }, { name: "description", content: "My app" }];
};

export default function Index() {
  return <></>;
}
