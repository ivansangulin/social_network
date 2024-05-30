import { Link, Outlet, useLocation, useParams } from "@remix-run/react";
import { MyData, UserData } from "~/service/user";
import { NewsPaperIcon, UserGroupIcon } from "./icons";

export const MyProfile = ({
  user,
  backendUrl,
}: {
  user: MyData;
  backendUrl: string;
}) => {
  const pathname = useLocation().pathname;
  const { username } = useParams();

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col bg-white w-full h-fit items-center space-y-4 pt-8">
        {user.profile_picture_uuid ? (
          <div className="rounded-full overflow-hidden aspect-square max-w-[150px]">
            <img
              alt=""
              src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
              className="object-cover min-h-full"
            />
          </div>
        ) : (
          <div className="overflow-hidden max-w-[150px]">
            <img alt="" src="/images/default_profile_picture.png" />
          </div>
        )}
        <div className="text-2xl text-center w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1">
          {username}
        </div>
        <div className="flex w-4/12 text-center border-b-2 border-primary text-2xl">
          <Link
            to={`/profile/${username}/posts`}
            className={`flex space-x-2 justify-center items-center px-4 border-r-2 border-primary basis-1/2 ${
              pathname.includes("posts") ? "fill-primary text-primary" : ""
            }`}
          >
            <div>Posts</div>
            <NewsPaperIcon />
          </Link>
          <Link
            to={`/profile/${username}/friends`}
            className={`flex space-x-2 justify-center items-center px-4 basis-1/2 ${
              pathname.includes("friends") ? "fill-primary text-primary" : ""
            }`}
          >
            <div>Friends</div>
            <UserGroupIcon />
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center space-x-4 w-6/12 py-4">
        <Outlet />
      </div>
    </div>
  );
};

export const UserProfile = ({
  userData,
  backendUrl,
}: {
  userData: UserData;
  backendUrl: string;
}) => {
  const { pathname } = useLocation();
  const { username } = useParams();
  const allowedToViewProfile =
    userData.areFriends || !userData.user.lockedProfile;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col bg-white w-full h-fit items-center space-y-4 pt-8">
        {userData.user.profilePictureUuid ? (
          <div className="rounded-full overflow-hidden aspect-square max-w-[150px]">
            <img
              alt=""
              src={`${backendUrl}/image/profile_picture/${userData.user.profilePictureUuid}`}
              className="object-cover min-h-full"
            />
          </div>
        ) : (
          <div className="overflow-hidden max-w-[150px]">
            <img alt="" src="/images/default_profile_picture.png" />
          </div>
        )}
        <div className="text-2xl text-center w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1">
          {username}
        </div>
        {allowedToViewProfile && (
          <div className="flex w-4/12 text-center border-b-2 border-primary text-2xl">
            <Link
              to={`/profile/${username}/posts`}
              className={`flex space-x-2 justify-center items-center px-4 border-r-2 border-primary basis-1/2 ${
                pathname.includes("posts") ? "fill-primary text-primary" : ""
              }`}
            >
              <div>Posts</div>
              <NewsPaperIcon />
            </Link>
            <Link
              to={`/profile/${username}/friends`}
              className={`flex space-x-2 justify-center items-center px-4 basis-1/2 ${
                pathname.includes("Friends") ? "fill-primary text-primary" : ""
              }`}
            >
              <div>Friends</div>
              <UserGroupIcon />
            </Link>
          </div>
        )}
      </div>
      {allowedToViewProfile ? (
        <div className="flex flex-col items-center justify-center space-x-4 w-6/12 py-4">
          <Outlet />
        </div>
      ) : (
        <div>Locked</div>
      )}
    </div>
  );
};
