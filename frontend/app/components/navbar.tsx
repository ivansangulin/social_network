import { Link, useLocation } from "@remix-run/react";
import { FriendRequests } from "./friend-requests";
import { Notifications } from "./notifications";
import { ChatBubbleOval, HomeIcon, LogOutIcon } from "./icons";
import { useUserData } from "~/hooks/useUserData";
import { useServerUrl } from "~/hooks/useServerUrl";

export const Navbar = () => {
  const user = useUserData()!;
  const backendUrl = useServerUrl();
  const location = useLocation();

  return (
    <div className="fixed left-0 z-10">
      <div className="flex flex-col relative bg-white h-svh min-w-[22rem] py-8 pl-4 pr-8 justify-between items-start">
        <div className="flex flex-col items-start space-y-4 w-full">
          <Link className="text-4xl py-4 px-2" to={"/"}>
            Beep-boop
          </Link>
          <Link
            to={"/"}
            className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
            onMouseDown={(e) => {
              e.currentTarget.classList.remove("[&>svg]:hover:scale-110");
              e.currentTarget.classList.add(
                "text-stone-300",
                "[&>svg]:scale-100",
                "[&>svg]:fill-stone-300",
                "[&>svg]:stroke-stone-300"
              );
            }}
            onMouseUp={(e) => {
              e.currentTarget.classList.remove(
                "text-stone-300",
                "[&>svg]:scale-100",
                "[&>svg]:fill-stone-300",
                "[&>svg]:stroke-stone-300"
              );
              e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                e.currentTarget.classList.remove(
                  "text-stone-300",
                  "[&>svg]:scale-100",
                  "[&>svg]:fill-stone-300",
                  "[&>svg]:stroke-stone-300"
                );
                e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
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
          <Link
            to={"/inbox"}
            className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
            onMouseDown={(e) => {
              e.currentTarget.classList.remove("[&>svg]:hover:scale-110");
              e.currentTarget.classList.add(
                "text-stone-300",
                "[&>svg]:scale-100",
                "[&>svg]:fill-stone-300",
                "[&>svg]:stroke-stone-300"
              );
            }}
            onMouseUp={(e) => {
              e.currentTarget.classList.remove(
                "text-stone-300",
                "[&>svg]:scale-100",
                "[&>svg]:fill-stone-300",
                "[&>svg]:stroke-stone-300"
              );
              e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                e.currentTarget.classList.remove(
                  "text-stone-300",
                  "[&>svg]:scale-100",
                  "[&>svg]:fill-stone-300",
                  "[&>svg]:stroke-stone-300"
                );
                e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
              }
            }}
          >
            <ChatBubbleOval
              className={`h-8 w-8 stroke-primary transition-transform duration-150 ${
                location.pathname === "/inbox" ? "fill-primary stroke-white" : "fill-transparent"
              }`}
            />
            <div className="text-lg">Messages</div>
          </Link>
          <FriendRequests />
          <Notifications />
          <Link
            to={`/profile/${user.username}/posts`}
            className="flex items-center px-2 space-x-4 rounded-lg hover:bg-stone-100 w-full py-2 [&>div>img]:hover:scale-110 [&>div>img]:transition-transform [&>div>img]:duration-150"
            onMouseDown={(e) => {
              e.currentTarget.classList.remove("[&>div>img]:hover:scale-110");
              e.currentTarget.classList.add(
                "text-stone-300",
                "[&>div>img]:scale-100",
                "[&>div>img]:fill-stone-300",
                "[&>div>img]:stroke-stone-300"
              );
            }}
            onMouseUp={(e) => {
              e.currentTarget.classList.remove(
                "text-stone-300",
                "[&>div>img]:scale-100",
                "[&>div>img]:fill-stone-300",
                "[&>div>img]:stroke-stone-300"
              );
              e.currentTarget.classList.add("[&>div>img]:hover:scale-110");
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                e.currentTarget.classList.remove(
                  "text-stone-300",
                  "[&>div>img]:scale-100",
                  "[&>div>img]:fill-stone-300",
                  "[&>div>img]:stroke-stone-300"
                );
                e.currentTarget.classList.add("[&>div>img]:hover:scale-110");
              }
            }}
          >
            <div className="rounded-full overflow-hidden aspect-square max-w-8">
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
        </div>
        <Link
          to={"/login"}
          className="flex items-center hover:bg-stone-100 px-2 w-full py-2 space-x-4 rounded-lg [&>svg]:hover:scale-110"
          onMouseDown={(e) => {
            e.currentTarget.classList.remove("[&>svg]:hover:scale-110");
            e.currentTarget.classList.add(
              "text-stone-300",
              "[&>svg]:scale-100",
              "[&>svg]:fill-stone-300",
              "[&>svg]:stroke-stone-300"
            );
          }}
          onMouseUp={(e) => {
            e.currentTarget.classList.remove(
              "text-stone-300",
              "[&>svg]:scale-100",
              "[&>svg]:fill-stone-300",
              "[&>svg]:stroke-stone-300"
            );
            e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
          }}
          onMouseLeave={(e) => {
            if (e.currentTarget.classList.contains("text-stone-300")) {
              e.currentTarget.classList.remove(
                "text-stone-300",
                "[&>svg]:scale-100",
                "[&>svg]:fill-stone-300",
                "[&>svg]:stroke-stone-300"
              );
              e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
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
