import { Link } from "@remix-run/react";
import { useUserData } from "~/hooks/useUserData";
import { FriendRequests } from "./friend-requests";
import { Notifications } from "./notifications";

export const Navbar = () => {
  const user = useUserData();
  return (
    <div className="flex flex-row bg-primary min-h-24 justify-between items-center drop-shadow-2xl sticky top-0 z-10">
      <Link className="text-white text-4xl py-4 px-12" to={"/"}>
        App name
      </Link>
      {!!user && (
        <div className="flex justify-between items-center space-x-4">
          <FriendRequests />
          <Notifications />
          <Link
            to={"/login"}
            className="text-white text-2xl py-4 pr-24 hover:underline"
          >
            Log out
          </Link>
        </div>
      )}
    </div>
  );
};
