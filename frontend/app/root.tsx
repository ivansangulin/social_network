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
import { getCookie, me } from "./service/user";
import { createContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await me(request);
  const cookie = getCookie(request);
  return json({ user, cookie });
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
  const { cookie, user } = useLoaderData<typeof loader>();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (user && !socket) {
      const socketTmp = io("http://localhost:4200", {
        extraHeaders: {
          Authorization: `${cookie}` ?? "",
        },
      });
      setSocket(socketTmp);
      return () => {
        setSocket(null);
        socketTmp.disconnect();
      };
    }
  }, []);

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
          <div className="min-h-screen w-full flex flex-col relative">
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
