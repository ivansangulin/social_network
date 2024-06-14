import { useFetcher } from "@remix-run/react";
import { useContext, useEffect, useState } from "react";
import { FriendRequest, PendingRequests } from "~/service/friend-requests";
import { CheckIcon, UsersIcon, XMarkIcon } from "./icons";
import { useServerUrl } from "~/hooks/useServerUrl";
import { SocketContext } from "~/root";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

export const FriendRequests = () => {
  return (
    <Popover className="h-fit w-full">
      {({ open }) => <PopoverContent open={open} />}
    </Popover>
  );
};

const PopoverContent = ({ open }: { open: boolean }) => {
  const socket = useContext(SocketContext);
  const fetcher = useFetcher();
  const [unreadFriendRequestsCount, setUnreadFriendRequestsCount] =
    useState<number>(0);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(open);
  const backendUrl = useServerUrl();

  useEffect(() => {
    setPopoverOpen(open);
    if (open && unreadFriendRequestsCount > 0) {
      setUnreadFriendRequestsCount(0);
      socket?.emit("readFriendRequests");
    }
  }, [open]);

  useEffect(() => {
    fetcher.load("/resource/friend-requests");
  }, []);

  useEffect(() => {
    const handleNewFriendRequest = ({
      id,
      username,
      profile_picture_uuid,
    }: {
      id: string;
      username: string;
      profile_picture_uuid: string;
    }) => {
      setFriendRequests((friendRequests) => {
        return [
          { read: popoverOpen, user: { id, username, profile_picture_uuid } },
          ...friendRequests,
        ];
      });
      if (popoverOpen) {
        socket?.emit("readFriendRequests");
      } else {
        setUnreadFriendRequestsCount((count) => {
          return count + 1;
        });
      }
    };
    socket?.on("newFriendRequest", handleNewFriendRequest);

    const handleCanceledRequest = ({
      friendUsername,
    }: {
      friendUsername: string;
    }) => {
      setFriendRequests((friendRequests) => {
        const friendRequest = friendRequests.find(
          (fr) => fr.user.username === friendUsername
        );
        if (friendRequest) {
          if (!friendRequest.read) {
            setUnreadFriendRequestsCount((count) => {
              return count - 1;
            });
          }
          return [
            ...friendRequests.filter(
              (fr) => fr.user.username !== friendUsername
            ),
          ];
        } else {
          return friendRequests;
        }
      });
    };
    socket?.on("canceledRequest", handleCanceledRequest);

    return () => {
      socket?.off("canceledRequest", handleCanceledRequest);
      socket?.off("newFriendRequest", handleNewFriendRequest);
    };
  }, [socket]);

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

  const handleFriendRequest = (id: string, accepted: boolean) => {
    const friendRequest = friendRequests.find((fr) => fr.user.id === id);
    setFriendRequests((friendRequests) => {
      return [...friendRequests.filter((req) => req.user.id !== id)];
    });
    fetch("/resource/friend-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "handle",
        friendId: id,
        accepted: accepted,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success && friendRequest) {
          setFriendRequests((friendRequests) => {
            return [
              friendRequest,
              ...friendRequests.filter((req) => req.user.id !== id),
            ];
          });
        }
      })
      .catch(() => {
        if (friendRequest) {
          setFriendRequests((friendRequests) => {
            return [
              friendRequest,
              ...friendRequests.filter((req) => req.user.id !== id),
            ];
          });
        }
      });
  };
  return (
    <>
      <PopoverButton
        className="h-fit w-full flex items-center space-x-4 p-2 outline-none rounded-lg hover:bg-stone-100 [&>div>svg]:hover:scale-110"
        onMouseDown={(e) => {
          e.currentTarget.classList.remove("[&>div>svg]:hover:scale-110");
          e.currentTarget.classList.add(
            "text-stone-300",
            "[&>div>svg]:scale-100",
            "[&>div>svg]:fill-stone-300",
            "[&>div>svg]:stroke-stone-300"
          );
        }}
        onMouseUp={(e) => {
          e.currentTarget.classList.remove(
            "text-stone-300",
            "[&>div>svg]:scale-100",
            "[&>div>svg]:fill-stone-300",
            "[&>div>svg]:stroke-stone-300"
          );
          e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget.classList.contains("text-stone-300")) {
            e.currentTarget.classList.remove(
              "text-stone-300",
              "[&>div>svg]:scale-100",
              "[&>div>svg]:fill-stone-300",
              "[&>div>svg]:stroke-stone-300"
            );
            e.currentTarget.classList.add("[&>div>svg]:hover:scale-110");
          }
        }}
      >
        <div className="relative">
          <UsersIcon
            className={`h-8 w-8 transition-transform duration-150 ${
              popoverOpen
                ? "fill-primary stroke-white"
                : "fill-transparent stroke-primary"
            }`}
          />
          {unreadFriendRequestsCount > 0 && (
            <div className="font-bold text-sm rounded-md px-1 h-fit bg-red-500 text-white absolute top-1/2 left-3/4">
              {unreadFriendRequestsCount}
            </div>
          )}
        </div>
        <div className="text-lg">Friend requests</div>
      </PopoverButton>
      <PopoverPanel className="flex flex-col p-2 rounded-e-3xl absolute top-0 left-full min-w-[28rem] h-svh bg-white border-secondary border-l">
        <div className="flex flex-col px-2">
          <div className="text-xl font-semibold py-2">Friend requests</div>
          <hr />
          <div className="flex flex-col overflow-y-auto scrollbar-thin">
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
                      onClick={() => handleFriendRequest(request.user.id, true)}
                    >
                      <CheckIcon className="h-6 w-6 fill-green-500" />
                    </button>
                    <button
                      className="p-1 rounded-full hover:bg-stone-100"
                      onClick={() =>
                        handleFriendRequest(request.user.id, false)
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
        </div>
      </PopoverPanel>
    </>
  );
};
