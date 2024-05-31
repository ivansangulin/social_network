import { Link, Outlet, useLocation, useParams } from "@remix-run/react";
import { MyData, UserData } from "~/service/user";
import {
  LockClosedIcon,
  NewsPaperIcon,
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "./icons";
import { useContext, useState } from "react";
import { SocketContext } from "~/root";

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
  const [areFriends, setAreFriends] = useState<boolean>(userData.areFriends);
  const allowedToViewProfile = areFriends || !userData.user.lockedProfile;
  const socket = useContext(SocketContext);
  const [pendingRequest, setPendingRequest] = useState<boolean>(
    userData.friendRequestIsPending
  );

  const addFriend = () => {
    socket?.emit(
      "newFriendRequest",
      { friendUsername: username },
      (success: boolean) => {
        if (success) {
          setPendingRequest(true);
        }
      }
    );
  };

  const cancelFriendRequest = () => {
    socket?.emit(
      "handleFriendRequest",
      { accepted: false, friendUsername: username },
      (success: boolean) => {
        if (success) {
          setPendingRequest(false);
        }
      }
    );
  };

  const removeFriend = () => {
    socket?.emit(
      "removeFriend",
      { friendUsername: username },
      (success: boolean) => {
        if (success) {
          setAreFriends(false);
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col bg-white w-full h-fit items-center space-y-4 pt-8">
        <div className="w-4/12 flex items-center justify-between !mb-4">
          <div className="flex space-x-4 items-center">
            {userData.user.profilePictureUuid ? (
              <div className="rounded-full overflow-hidden aspect-square max-w-[120px]">
                <img
                  alt=""
                  src={`${backendUrl}/image/profile_picture/${userData.user.profilePictureUuid}`}
                  className="object-cover min-h-full"
                />
              </div>
            ) : (
              <div className="overflow-hidden max-w-[120px]">
                <img alt="" src="/images/default_profile_picture.png" />
              </div>
            )}
            <div className="text-2xl p-2">{username}</div>
          </div>
          {!areFriends ? (
            !pendingRequest ? (
              <button
                className="flex bg-primary hover:bg-primary-dark py-2 px-3 text-white rounded-lg items-center space-x-2"
                onClick={addFriend}
              >
                <div>Add friend</div>
                <UserPlusIcon className="h-6 w-6 fill-white" />
              </button>
            ) : (
              <button
                className="flex bg-secondary hover:bg-secondary-dark py-2 px-3 rounded-lg items-center space-x-2"
                onClick={cancelFriendRequest}
              >
                <div>Cancel request</div>
                <UserMinusIcon className="h-6 w-6" />
              </button>
            )
          ) : (
            <button
              className="flex bg-red-400 hover:bg-red-500 py-2 px-3 text-white rounded-lg items-center space-x-2"
              onClick={removeFriend}
            >
              <div>Unfriend</div>
              <UserMinusIcon className="h-6 w-6 fill-white" />
            </button>
          )}
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
        <div className="flex flex-col items-center justify-center space-x-4 w-4/12 py-4">
          <Outlet />
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2 w-6/12 py-4">
          <LockClosedIcon className="h-10 w-10" />
          <div className="text-xl">{"This user's profile is private!"}</div>
        </div>
      )}
    </div>
  );
};
