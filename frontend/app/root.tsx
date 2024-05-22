import { json, LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  ShouldRevalidateFunction,
  useLoaderData,
} from "@remix-run/react";
import stylesheet from "./tailwind.css?url";
import { Navbar } from "./components/navbar";
import { me } from "./service/user";
import { createContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await me(request);
  return json({ user, backendURL: process.env.BACKEND_URL });
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

export const SocketContext = createContext<Socket | null>(null);

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, backendURL } = useLoaderData<typeof loader>();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user && backendURL) {
      const socketTmp = io(backendURL, {
        withCredentials: true,
      });
      setSocket(socketTmp);
      return () => {
        setSocket(null);
        socketTmp.disconnect();
      };
    }
  }, [user]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <SocketContext.Provider value={socket}>
          <div className="min-h-screen w-full flex flex-col relative bg-neutral-100">
            <Navbar />
            {children}
          </div>
        </SocketContext.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
