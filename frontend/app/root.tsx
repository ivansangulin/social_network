import {
  json,
  LinksFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  ShouldRevalidateFunction,
} from "@remix-run/react";
import stylesheet from "./tailwind.css?url";
import { Navbar } from "./components/navbar";
import { me } from "./service/user";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await me(request);
  return json(user);
};

export type rootLoader = typeof loader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  defaultShouldRevalidate,
  currentUrl,
  nextUrl,
}) => {
  if (
    currentUrl.pathname.includes("/login") ||
    currentUrl.pathname.includes("/register") ||
    nextUrl.pathname.includes("/login") ||
    nextUrl.pathname.includes("/register")
  ) {
    return true;
  }
  return defaultShouldRevalidate;
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-screen w-full flex flex-col">
          <Navbar />
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
