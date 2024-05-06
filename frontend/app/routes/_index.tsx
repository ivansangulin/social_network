import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  FormEvent,
  KeyboardEvent,
  useContext,
  MouseEvent,
} from "react";
import {
  ChevronDoubleDown,
  ChevronDoubleUp,
  PaperAirplaneIcon,
  XMarkIcon,
} from "~/components/icons";
import { SocketContext } from "~/root";
import { Message } from "~/service/chat";
import { Friend, FriendsPagingType, getFriends } from "~/service/friendship";
import { me, User } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, friendsPaging] = await Promise.all([
    me(request),
    getFriends(request, null, null),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json({
    user: user!,
    friendsPaging,
    backendUrl: process.env.BACKEND_URL,
  });
};

type FriendData = {
  uuid: string;
  username: string;
  profile_picture_uuid?: string | null | undefined;
};

export default function Index() {
  const { user, backendUrl } = useLoaderData<typeof loader>();
  const [friends, setFriends] = useState<FriendData[]>([]);
  return (
    <div className="grow flex">
      <Friends
        onNewChat={(friend) => {
          if (friends.find((f) => f.uuid === friend.uuid)) return;
          setFriends((friends) => {
            return [friend, ...friends];
          });
        }}
      />
      <div className="basis-3/5 border-r border-slate-400 relative">
        <Chats
          friends={friends}
          onDeleteChat={(uuid) => {
            setFriends((friends) => {
              return [...friends.filter((f) => f.uuid !== uuid)];
            });
          }}
          setFirst={(uuid) => {
            const el = friends.find((f) => f.uuid === uuid)!;
            setFriends([el, ...friends.filter((f) => f.uuid !== uuid)]);
          }}
        />
      </div>
      <ProfileData user={user} backendUrl={backendUrl} />
    </div>
  );
}

const ProfileData = ({
  user,
  backendUrl,
}: {
  user: User;
  backendUrl: string | undefined;
}) => {
  return (
    <div className="basis-1/5 p-4">
      <div className="flex flex-col items-center space-y-2">
        {user.profile_picture_uuid && backendUrl ? (
          <Link
            to={"/my-profile"}
            className="rounded-full overflow-hidden aspect-square max-w-[150px]"
          >
            <img
              alt=""
              src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
              className="object-cover min-h-full"
            />
          </Link>
        ) : (
          <Link to={"/my-profile"} className="overflow-hidden max-w-[150px]">
            <img alt="" src="/images/default_profile_picture.png" />
          </Link>
        )}
        <Link
          to={"/my-profile"}
          className="text-2xl text-center min-w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1"
        >
          {user.username}
        </Link>
      </div>
    </div>
  );
};

const Friends = ({
  onNewChat,
}: {
  onNewChat: (friend: FriendData) => void;
}) => {
  const { friendsPaging, backendUrl } = useLoaderData<typeof loader>();
  const [cursor, setCursor] = useState<number>(friendsPaging?.cursor ?? 0);
  const [friends, setFriends] = useState<Friend[]>(
    friendsPaging?.friends ?? []
  );
  const [search, setSearch] = useState<string>("");
  const [fetching, setFetching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(
    friends.length !== (friendsPaging?.count ?? 0)
  );
  const [newSearch, setNewSearch] = useState<boolean>(false);
  const fetcher = useFetcher();

  useEffect(() => {
    const handleScroll = () => {
      if (
        document.documentElement.scrollHeight >
          document.documentElement.offsetHeight +
            document.documentElement.scrollTop ||
        fetching ||
        !hasMore
      ) {
        return;
      }
      fetch();
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [fetching, hasMore]);

  useEffect(() => {
    setFetching(false);
    const fetcherFriendsPaging = fetcher.data as FriendsPagingType | null;
    if (fetcherFriendsPaging) {
      const fetcherFriends = fetcherFriendsPaging.friends;
      if (!newSearch) {
        fetcherFriends.unshift(...friends);
      } else {
        setNewSearch(false);
      }
      setFriends(fetcherFriends);
      setCursor(fetcherFriendsPaging.cursor);
      setHasMore(fetcherFriends.length !== fetcherFriendsPaging.count);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (newSearch) {
      fetch();
    }
  }, [newSearch]);

  const fetch = () => {
    setFetching(true);
    fetcher.load(
      `/resource/get-friends?search=${search}${
        newSearch ? "" : `&cursor=${cursor}`
      }`
    );
  };

  const handleNewSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value);
    setNewSearch(true);
  };

  return (
    <div className="basis-1/5 border-r border-slate-400 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex flex-col items-center space-y-6 w-full p-4">
        <div className="flex flex-col items-center space-y-6 w-full">
          <div className="flex space-x-4 justify-center items-center w-full">
            <div className="text-2xl">My friends</div>
            {fetching && <div className="animate-bounce">...</div>}
          </div>
          <input
            type="text"
            className="rounded-lg min-h-12 px-4 border border-slate-300 w-full"
            placeholder="Search friends by username..."
            onChange={handleNewSearch}
          />
        </div>
        {friends ? (
          friends.length > 0 ? (
            <div className="flex flex-col gap-4 min-w-full">
              {friends.map(({ friend }) => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div
                  key={friend.uuid}
                  className="flex items-center space-x-2 rounded-md p-2 hover:bg-slate-100 hover:cursor-pointer"
                  onClick={() => {
                    onNewChat(friend);
                  }}
                >
                  {friend.profile_picture_uuid && backendUrl ? (
                    <div className="rounded-full overflow-hidden aspect-square max-w-[40px]">
                      <img
                        alt=""
                        src={`${backendUrl}/image/profile_picture/${friend.profile_picture_uuid}`}
                        className="object-cover min-h-full"
                      />
                    </div>
                  ) : (
                    <div className="overflow-hidden max-w-[40px]">
                      <img alt="" src="/images/default_profile_picture.png" />
                    </div>
                  )}
                  <div className="text">{friend.username}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-4xl text-center">No friends found...</div>
          )
        ) : (
          <div className="text-4xl text-center">
            Error occured fetching friends...
          </div>
        )}
      </div>
    </div>
  );
};

const Chats = ({
  friends,
  onDeleteChat,
  setFirst,
}: {
  friends: FriendData[];
  onDeleteChat: (uuid: string) => void;
  setFirst: (uuid: string) => void;
}) => {
  const [shownChats, setShownChats] = useState<FriendData[]>([]);
  const [popoverChats, setPopoverChats] = useState<FriendData[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null);

  const elementWidth = 288;
  const triggerWidth = 40;

  useEffect(() => {
    if (window) {
      window.addEventListener("resize", organizeChats);
      window.addEventListener("click", closePopover);
      return () => {
        window.removeEventListener("resize", organizeChats);
        window.removeEventListener("click", closePopover);
      };
    }
  }, [popoverOpen, friends]);

  useEffect(() => {
    organizeChats();
  }, [friends]);

  const organizeChats = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const nrOfChatsToShow = Math.floor(
        (containerWidth - triggerWidth) / elementWidth
      );
      if (nrOfChatsToShow > friends.length) {
        setShownChats(friends);
        if (popoverChats.length > 0) setPopoverChats([]);
        setPopoverOpen(false);
      } else {
        setShownChats(friends.slice(0, nrOfChatsToShow));
        setPopoverChats(friends.slice(nrOfChatsToShow));
      }
    }
  };

  const closePopover = () => {
    if (popoverOpen) {
      setPopoverOpen(false);
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 flex items-end px-2 w-full z-10"
      ref={containerRef}
    >
      {shownChats.map((friend, index) => (
        <Chat
          key={friend.uuid}
          className=""
          friend={friend}
          onDeleteChat={() => onDeleteChat(friend.uuid)}
          popoverOpen={popoverOpen}
          defaultOpen={index === 0}
          closePopover={closePopover}
        />
      ))}
      {popoverChats.length > 0 && (
        <div className="relative">
          <button
            className="flex justify-center items-center p-2 border-x-2 border-t-2 border-white w-[40px] bg-primary text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(!popoverOpen);
            }}
            ref={popoverTriggerRef}
          >
            {!popoverOpen ? <ChevronDoubleUp /> : <ChevronDoubleDown />}
          </button>

          {popoverOpen && (
            <div
              className="absolute"
              style={{
                top: `-${
                  popoverChats.length * popoverTriggerRef.current!.offsetHeight
                }px`,
                left: `-${elementWidth - triggerWidth}px`,
              }}
            >
              {popoverChats.map((friend) => (
                <Chat
                  key={friend.uuid}
                  className="px-4"
                  friend={friend}
                  onDeleteChat={() => onDeleteChat(friend.uuid)}
                  inPopover
                  popoverOpen={popoverOpen}
                  defaultOpen={false}
                  setFirst={setFirst}
                  closePopover={closePopover}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Chat = ({
  className,
  friend,
  onDeleteChat,
  inPopover,
  defaultOpen,
  popoverOpen,
  setFirst,
  closePopover,
}: {
  className: string;
  friend: FriendData;
  onDeleteChat: () => void;
  inPopover?: boolean;
  defaultOpen: boolean;
  popoverOpen: boolean;
  setFirst?: (uuid: string) => void;
  closePopover: () => void;
}) => {
  const socket = useContext(SocketContext);

  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [rows, setRows] = useState<number>(1);
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  const messageFetcher = useFetcher();

  const messageRef = useRef<HTMLDivElement>(null);

  const maxRows = 5;
  const colsDefault = 24;

  useEffect(() => {
    if (popoverOpen) {
      setOpen(false);
    }
  }, [popoverOpen]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setMessages((messages) => {
        return [message, ...messages];
      });
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: "instant" });
      }
    };
    messageFetcher.load(`/resource/get-messages?friendUuid=${friend.uuid}`);
    socket?.on(friend.uuid, handleNewMessage);
    return () => {
      socket?.off(friend.uuid, handleNewMessage);
    };
  }, []);

  useEffect(() => {
    if (messageFetcher.data) {
      setMessages((messages) => {
        return [...(messageFetcher.data as Message[]), ...messages];
      });
    }
  }, [messageFetcher.data]);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  const handleOpenClose = (e: MouseEvent<HTMLButtonElement>) => {
    closePopover();
    if (inPopover) {
      e.stopPropagation();
      if (setFirst) {
        setFirst(friend.uuid);
        return;
      }
    }
    setOpen(!open);
  };

  const handleTextAreaChange = (e: FormEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(e.currentTarget.value);
    if (rows <= maxRows) {
      const element = e.target as HTMLTextAreaElement;
      console.log(element.textLength);
      const newRows = Math.max(Math.ceil(element.textLength / colsDefault), 1);
      if (newRows <= maxRows && newRows !== rows) setRows(newRows);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      socket?.emit("message", {
        friendUuid: friend.uuid,
        message: textAreaValue,
      });
      setTextAreaValue("");
      setRows(1);
    }
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    if (inPopover) e.stopPropagation();
    onDeleteChat();
  };

  return (
    <div className="w-72 border-x-2 border-t-2 border-white">
      <div
        className={`${className} flex items-center justify-between p-2 bg-primary text-white w-full`}
      >
        <button className="truncate hover:underline" onClick={handleOpenClose}>
          {friend.username}
        </button>
        <button onClick={handleDelete}>
          <XMarkIcon />
        </button>
      </div>
      {open && (
        <div className="border-x border-black">
          <div className="h-72 flex flex-col-reverse p-4 overflow-y-auto">
            <div ref={messageRef} />
            {messages.map((msg, index) => (
              <div
                className={`max-w-[40%] ${
                  msg.sender === friend.uuid ? "self-start" : "self-end"
                }`}
                key={index}
              >
                {msg.message}
              </div>
            ))}
          </div>
          <div className="border-t border-black flex justify-between p-2">
            <textarea
              rows={rows}
              cols={colsDefault}
              placeholder="Message"
              className="w-full outline-none resize-none scrollbar-hidden text-base"
              onChange={handleTextAreaChange}
              value={textAreaValue}
              onKeyDown={handleKeyDown}
            />
            <div className="pl-2">
              <PaperAirplaneIcon />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
