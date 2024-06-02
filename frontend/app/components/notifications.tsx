import { useContext, useEffect, useState } from "react";
import { BellIcon } from "./icons";
import { SocketContext } from "~/root";
import { useFetcher } from "@remix-run/react";
import { NotificationData, NotificationType } from "~/service/notifications";
import { useServerUrl } from "~/hooks/useServerUrl";

export const Notifications = () => {
  const socket = useContext(SocketContext);
  const [windowOpen, setWindowOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const fetcher = useFetcher();
  const backendUrl = useServerUrl();

  useEffect(() => {
    fetcher.load("/resource/notifications");
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
    if (!windowOpen) {
      setUnreadCount(0);
      socket?.emit("readNotifications");
    }
    setWindowOpen((windowOpen) => {
      return !windowOpen;
    });
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="relative h-fit" onClick={(e) => e.stopPropagation()}>
      <button className="h-fit relative" onClick={onWindowOpen}>
        <BellIcon
          className={`h-8 w-8 stroke-primary ${
            windowOpen ? "fill-black" : "fill-white"
          }`}
        />
        {unreadCount > 0 && (
          <div className="font-bold text-sm rounded-md px-1 h-fit bg-red-500 text-white absolute top-1/2 left-3/4">
            {unreadCount}
          </div>
        )}
      </button>
      {windowOpen && (
        <div
          className={`flex flex-col rounded-md absolute top-full right-0 min-w-[28rem] ${
            notifications.length > 2 ? "h-[9rem]" : "h-fit"
          } bg-white border-black overflow-y-auto scrollbar-thin`}
        >
          {notifications.length > 0 ? (
            notifications.map((notification, idx) => (
              <div
                className={`py-4 px-2 flex justify-between items-center ${idx % 2 !== 0 && "bg-secondary"}`}
                key={notification.id}
              >
                <div className="flex items-center space-x-2">
                  {notification.sender.profile_picture_uuid && backendUrl ? (
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
                  <div className="">{notification.message}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 py-4 text-center w-full text-lg">
              You have no new notifications!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
