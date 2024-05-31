import { useFetcher } from "@remix-run/react";
import { useContext, useEffect, useState } from "react";
import { FriendRequest, PendingRequests } from "~/service/friend-requests";
import { CheckIcon, UsersIcon, XMarkIcon } from "./icons";
import { useServerUrl } from "~/hooks/useServerUrl";
import { SocketContext } from "~/root";

export const FriendRequests = () => {
  const socket = useContext(SocketContext);
  const fetcher = useFetcher();
  const [unreadFriendRequestsCount, setUnreadFriendRequestsCount] =
    useState<number>(0);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [windowOpen, setWindowOpen] = useState<boolean>(false);
  const backendUrl = useServerUrl();

  useEffect(() => {
    fetcher.load("/resource/get-friend-requests");
    if (window) {
      const onWindowClick = () => {
        setWindowOpen(false);
      };
      window.addEventListener("click", onWindowClick);
      return () => {
        window.removeEventListener("click", onWindowClick);
      };
    }
  }, []);

  useEffect(() => {
    const fetcherData = fetcher.data as PendingRequests | null;
    if (fetcherData) {
      setUnreadFriendRequestsCount(fetcherData.unreadFriendRequestCount);
      setFriendRequests(fetcherData.friendRequests);
      fetcherData.friendRequests.forEach((fr) => {
        if (fr.user.profile_picture_uuid) {
          const image = new Image();
          image.src = `${backendUrl}/image/profile_picture/${fr.user.profile_picture_uuid}`;
        }
      });
    }
  }, [fetcher.data]);

  const onClick = () => {
    if (!windowOpen) {
      setUnreadFriendRequestsCount(0);
      socket?.emit("readFriendRequests");
    }
    setWindowOpen((open) => {
      return !open;
    });
  };

  const handleFriendRequest = (username: string, accepted: boolean) => {
    socket?.emit(
      "handleFriendRequest",
      { friendUsername: username, accepted },
      (success: boolean) => {
        if (success) {
          setFriendRequests((friendRequests) => {
            return [
              ...friendRequests.filter((req) => req.user.username !== username),
            ];
          });
        }
      }
    );
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="relative h-fit" onClick={(e) => e.stopPropagation()}>
      <button className="h-fit relative" onClick={onClick}>
        <UsersIcon
          className={`h-8 w-8 ${windowOpen ? "fill-black" : "fill-white"}`}
        />
        {unreadFriendRequestsCount > 0 && (
          <div className="font-bold text-sm rounded-md px-1 h-fit bg-red-500 text-white absolute top-1/2 left-3/4">
            {unreadFriendRequestsCount}
          </div>
        )}
      </button>
      {windowOpen && (
        <div
          className={`flex flex-col rounded-md absolute top-full right-0 min-w-[28rem] ${
            friendRequests.length > 2 ? "h-[9rem]" : "h-fit"
          } bg-white border-black overflow-y-auto scrollbar-thin`}
        >
          {friendRequests.length > 0 ? (
            friendRequests.map((request) => (
              <div
                className="py-4 px-2 flex justify-between items-center"
                key={request.user.username}
              >
                <div className="flex items-center space-x-2">
                  {request.user.profile_picture_uuid && backendUrl ? (
                    <img
                      alt=""
                      src={`${backendUrl}/image/profile_picture/${request.user.profile_picture_uuid}`}
                      className="object-cover rounded-full aspect-square max-w-[40px]"
                    />
                  ) : (
                    <img
                      alt=""
                      src="/images/default_profile_picture.png"
                      className="max-w-[40px]"
                    />
                  )}
                  <div className="">
                    <span className="font-bold">{request.user.username}</span>{" "}
                    sent you a friend request!
                  </div>
                </div>
                <div className="ml-4 mr-4 flex space-x-2">
                  <button
                    className="p-1 rounded-full hover:bg-stone-100"
                    onClick={() =>
                      handleFriendRequest(request.user.username, true)
                    }
                  >
                    <CheckIcon className="h-6 w-6 fill-green-500" />
                  </button>
                  <button
                    className="p-1 rounded-full hover:bg-stone-100"
                    onClick={() =>
                      handleFriendRequest(request.user.username, false)
                    }
                  >
                    <XMarkIcon className="h-6 w-6 stroke-amber-600" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 py-4 text-center w-full text-lg">
              You have no new friend requests!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
