import { useContext, useEffect, useState } from "react";
import { BellIcon } from "./icons";
import { SocketContext } from "~/root";
import { Link, useFetcher } from "@remix-run/react";
import { NotificationData, NotificationType } from "~/service/notifications";
import { useServerUrl } from "~/hooks/useServerUrl";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

export const Notifications = () => {
  const socket = useContext(SocketContext);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const fetcher = useFetcher();
  const backendUrl = useServerUrl();

  useEffect(() => {
    fetcher.load("/resource/notifications");
  }, []);

  useEffect(() => {
    const data = fetcher.data as NotificationData | null;
    if (data) {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }, [fetcher.data]);

  useEffect(() => {
    const handleNewNotification = ({
      notification,
    }: {
      notification: NotificationType;
    }) => {
      setNotifications((notifications) => {
        return [notification, ...notifications];
      });
      setUnreadCount((u) => {
        return u + 1;
      });
    };
    socket?.on("notification", handleNewNotification);
    return () => {
      socket?.off("notification", handleNewNotification);
    };
  }, [socket]);

  const onWindowOpen = () => {
    if (unreadCount > 0) {
      setUnreadCount(0);
      socket?.emit("readNotifications");
    }
  };

  return (
    <Popover className="h-fit w-full">
      {({ open }) => (
        <>
          <PopoverButton
            className="h-fit w-full flex items-center space-x-4 p-2 outline-none rounded-lg hover:bg-stone-100 [&>div>svg]:hover:scale-110"
            onClick={onWindowOpen}
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
              <BellIcon
                className={`h-8 w-8 stroke-1 transition-transform duration-150 ${
                  open
                    ? "fill-primary stroke-white"
                    : "fill-transparent stroke-primary"
                }`}
              />
              {unreadCount > 0 && (
                <div className="font-bold text-sm rounded-md px-1 h-fit bg-red-500 text-white absolute top-1/2 left-3/4">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>
            <div className="text-lg">Notifications</div>
          </PopoverButton>
          <PopoverPanel className="flex flex-col p-2 rounded-e-3xl absolute top-0 left-full min-w-[28rem] h-svh bg-white border-secondary border-l">
            {({ close }) => (
              <div className="flex flex-col px-2">
                <div className="text-xl font-semibold py-2">Notifications</div>
                <hr className="bg-secondary" />
                <div className="flex flex-col overflow-y-auto scrollbar-thin">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        className="py-4 flex space-x-2 justify-between items-center"
                        key={notification.id}
                      >
                        <div className="flex items-center space-x-2">
                          {notification.sender.profile_picture_uuid &&
                          backendUrl ? (
                            <img
                              alt=""
                              src={`${backendUrl}/image/profile_picture/${notification.sender.profile_picture_uuid}`}
                              className="object-cover rounded-full aspect-square max-w-[40px]"
                            />
                          ) : (
                            <img
                              alt=""
                              src="/images/default_profile_picture.png"
                              className="max-w-[40px]"
                            />
                          )}
                          <div className="flex flex-col">
                            <div className="">
                              <Link
                                to={`/profile/${notification.sender.username}/posts`}
                                className="font-bold hover:underline break-words"
                                onClick={() => close()}
                              >
                                {notification.sender.username}{" "}
                              </Link>
                              {notification.message}
                            </div>
                            <div className="">
                              {notification.createdDescriptive}
                            </div>
                          </div>
                        </div>
                        {notification.post_id && (
                          <Link
                            to={`/post/${notification.post_id}`}
                            className="self-end text-sky-600 hover:underline"
                            onClick={() => close()}
                          >
                            View post
                          </Link>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center w-full text-lg">
                      You have no new notifications!
                    </div>
                  )}
                </div>
              </div>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};
