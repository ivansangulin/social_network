import { useRouteLoaderData } from "@remix-run/react";
import { rootLoader } from "~/root";

export const useUserData = () => {
  return useRouteLoaderData<rootLoader>("root");
};
