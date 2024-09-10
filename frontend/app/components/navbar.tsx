import { Link, useLocation } from "@remix-run/react";
import { FriendRequests } from "./friend-requests";
import { Notifications } from "./notifications";
import { ChatBubbleOval, HomeIcon, LogOutIcon, SettingsIcon } from "./icons";
import { useUserData } from "~/hooks/useUserData";
import { useServerUrl } from "~/hooks/useServerUrl";
import { Search } from "./search";
import { MouseEvent } from "react";

export const Navbar = () => {
  const user = useUserData()!;
  const backendUrl = useServerUrl();
  const location = useLocation();

  const onMouseDownSvg = (
    e: MouseEvent<HTMLAnchorElement> | MouseEvent<HTMLButtonElement>
  ) => {
    e.currentTarget.classList.remove("[&>svg]:hover:scale-110");
    e.currentTarget.classList.add(
      "text-stone-300",
      "[&>svg]:scale-100",
      "[&>svg]:fill-stone-300",
      "[&>svg]:stroke-stone-300"
    );
  };

  const onMouseUpSvg = (
    e: MouseEvent<HTMLAnchorElement> | MouseEvent<HTMLButtonElement>
  ) => {
    e.currentTarget.classList.remove(
      "text-stone-300",
      "[&>svg]:scale-100",
      "[&>svg]:fill-stone-300",
      "[&>svg]:stroke-stone-300"
    );
    e.currentTarget.classList.add("[&>svg]:hover:scale-110");
  };

  return (
    <div className="fixed left-0 z-10">
      <div className="flex flex-col relative bg-white h-svh min-w-[18rem] 3xl:min-w-[22rem] py-8 pl-4 pr-8 justify-between items-start">
        <div className="flex flex-col items-start space-y-4 w-full">
          <Link className="text-4xl py-4 px-2" to={"/"}>
            App
          </Link>
          <Link
            to={"/"}
            className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
            onMouseDown={onMouseDownSvg}
            onMouseUp={onMouseUpSvg}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                onMouseUpSvg(e);
              }
            }}
          >
            <HomeIcon
              className={`h-8 w-8 stroke-primary transition-transform duration-150 ${
                location.pathname === "/" ? "fill-primary" : "fill-transparent"
              }`}
            />
            <div className="text-lg">Home</div>
          </Link>
          <Search onMouseDownSvg={onMouseDownSvg} onMouseUpSvg={onMouseUpSvg} />
          <Link
            to={"/inbox"}
            className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
            onMouseDown={onMouseDownSvg}
            onMouseUp={onMouseUpSvg}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                onMouseUpSvg(e);
              }
            }}
          >
            <ChatBubbleOval
              className={`h-8 w-8 stroke-primary stroke-1 transition-transform duration-150 ${
                location.pathname === "/inbox"
                  ? "fill-primary stroke-white"
                  : "fill-transparent"
              }`}
            />
            <div className="text-lg">Messages</div>
          </Link>
          <FriendRequests />
          <Notifications />
          <Link
            to={`/profile/${user.username}/posts`}
            className="flex items-center px-2 space-x-4 rounded-lg hover:bg-stone-100 w-full py-2 [&>*:first-child]:hover:scale-110"
            onMouseDown={(e) => {
              e.currentTarget.classList.remove(
                "[&>*:first-child]:hover:scale-110"
              );
              e.currentTarget.classList.add(
                "text-stone-300",
                "[&>*:first-child]:scale-100",
                "[&>*:first-child]:fill-stone-300",
                "[&>*:first-child]:stroke-stone-300"
              );
            }}
            onMouseUp={(e) => {
              e.currentTarget.classList.remove(
                "text-stone-300",
                "[&>*:first-child]:scale-100",
                "[&>*:first-child]:fill-stone-300",
                "[&>*:first-child]:stroke-stone-300"
              );
              e.currentTarget.classList.add(
                "[&>*:first-child]:hover:scale-110"
              );
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                e.currentTarget.classList.remove(
                  "text-stone-300",
                  "[&>*:first-child]:scale-100",
                  "[&>*:first-child]:fill-stone-300",
                  "[&>*:first-child]:stroke-stone-300"
                );
                e.currentTarget.classList.add(
                  "[&>*:first-child]:hover:scale-110"
                );
              }
            }}
          >
            <div className="rounded-full overflow-hidden aspect-square max-w-8 transition-transform duration-150">
              {user.profile_picture_uuid ? (
                <img
                  alt=""
                  src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
                  className="object-cover min-h-full"
                />
              ) : (
                <img alt="" src="/images/default_profile_picture.png" />
              )}
            </div>
            <div className="text-lg">Profile</div>
          </Link>
          <Link
            to="/profile/edit"
            className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
            onMouseDown={onMouseDownSvg}
            onMouseUp={onMouseUpSvg}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                onMouseUpSvg(e);
              }
            }}
          >
            <SettingsIcon
              className={`h-8 w-8 stroke-primary stroke-1 transition-transform duration-150 ${
                location.pathname === "/profile/edit"
                  ? "fill-primary stroke-white"
                  : "fill-transparent"
              }`}
            />
            <div className="text-lg">Settings</div>
          </Link>
        </div>
        <Link
          to={"/login"}
          className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
          onMouseDown={onMouseDownSvg}
          onMouseUp={onMouseUpSvg}
          onMouseLeave={(e) => {
            if (e.currentTarget.classList.contains("text-stone-300")) {
              onMouseUpSvg(e);
            }
          }}
        >
          <LogOutIcon className="h-8 w-8 stroke-primary transition-transform duration-150" />
          <div className="text-lg">Log out</div>
        </Link>
      </div>
    </div>
  );
};
