import { useRouteLoaderData } from "@remix-run/react";
import { rootLoader } from "~/root";

export const useServerUrl = () => {
  return useRouteLoaderData<rootLoader>("root")?.backendURL;
};
