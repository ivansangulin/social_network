import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { differenceInCalendarDays, format } from "date-fns";
import {
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useCallback,
} from "react";
import { z } from "zod";
import { AnimatedDots } from "~/components/animated-dots";
import {
  ChevronDown,
  ExclamationTriangle,
  NewChatIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "~/components/icons";
import { useServerUrl } from "~/hooks/useServerUrl";
import { useUserData } from "~/hooks/useUserData";
import { SocketContext } from "~/root";
import {
  Chat,
  ChatsPaging,
  getChats,
  getNewChat,
  Message,
  MessagesPaging,
} from "~/service/chat";
import { Friend, FriendsPagingType } from "~/service/friendship";
import { me } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = new URL(request.url).searchParams;
  const cursor = params.get("cursor");
  const [user, chatsPaging] = await Promise.all([
    me(request),
    getChats(request, cursor),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json(chatsPaging);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const friendId = z
      .string()
      .parse((await request.formData()).get("friendId"));
    return await getNewChat(request, friendId);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export default () => {
  const chatsPaging = useLoaderData<typeof loader>();
  const backendUrl = useServerUrl();
  const socket = useContext(SocketContext);
  const fetcher = useFetcher();
  const [chats, setChats] = useState<Chat[]>(chatsPaging?.chats ?? []);
  const [activeChat, setActiveChat] = useState<Chat>();

  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<NewMessageHandle | null>(null);
  const cursor = useRef<string>(chatsPaging?.cursor ?? "");

  useEffect(() => {
    const handleNewMessage = (
      chatId: string,
      message: Message,
      friendData: Friend,
      unreadCount: number
    ) => {
      const sender = message.sender_id;
      if (sender === activeChat?.user.id && activeChatRef.current) {
        activeChatRef.current.receiveMessage(message);
        setChats((prevChats) => {
          return [
            { id: chatId, message: message, user: friendData, unreadCount },
            ...prevChats.filter((c) => c.id !== chatId),
          ];
        });
      } else {
        setChats((prevChats) => {
          return [
            { id: chatId, message: message, user: friendData, unreadCount },
            ...prevChats.filter((c) => c.id !== chatId),
          ];
        });
      }
    };
    if (socket) {
      socket.on("message", handleNewMessage);
      return () => {
        socket.off("message", handleNewMessage);
      };
    }
  }, [socket, activeChat]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        document.documentElement.scrollHeight >
          document.documentElement.clientHeight +
            document.documentElement.scrollTop ||
        fetching.current ||
        !hasMore.current
      ) {
        return;
      }
      fetching.current = true;
      fetcher.load(`/inbox?cursor=${cursor.current}`);
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const data = fetcher.data as ChatsPaging | null;
    if (data) {
      setChats((prevChats) => [...prevChats, ...data.chats]);
      cursor.current = data.cursor;
      hasMore.current = chats.length + data.chats.length !== data.count;
    }
    fetching.current = false;
  }, [fetcher.data]);

  const onNewActiveChat = (chat: Chat) => {
    if (chat.unreadCount > 0) chat.unreadCount = 0;
    setActiveChat(chat);
    const idx = chats.findIndex((c) => c.id === chat.id);
    if (idx !== -1) {
      setChats((prevChats) => {
        return [...prevChats.slice(0, idx), chat, ...prevChats.slice(idx + 1)];
      });
    } else {
      setChats((prevChats) => {
        return [chat, ...prevChats];
      });
    }
  };

  const calculateMessageDateDescriptive = (date: Date) => {
    const diffFromNow = differenceInCalendarDays(new Date(), date);
    const formatedDate =
      diffFromNow > 7
        ? format(date.toLocaleDateString(), "dd-MM-yyyy")
        : diffFromNow === 0
        ? "Today"
        : diffFromNow === 1
        ? "Yesterday"
        : format(date.toLocaleDateString(), "EEEE");
    return formatedDate;
  };

  return (
    <div className="pl-[22rem] flex h-svh">
      <div className="flex flex-col px-4 py-2 bg-white w-[28rem] border-l border-secondary shrink-0">
        <div className="flex justify-between items-center py-2">
          <div className="text-xl font-semibold">Inbox</div>
          <NewChatDialog onNewChat={onNewActiveChat} />
        </div>
        <hr />
        <div className="overflow-y-auto" ref={chatContainerRef}>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <button
                className="py-2 w-full flex space-x-2 items-center hover:bg-stone-100"
                key={chat.id}
                onClick={() => onNewActiveChat(chat)}
              >
                {chat.user.profile_picture_uuid && backendUrl ? (
                  <img
                    alt=""
                    src={`${backendUrl}/image/profile_picture/${chat.user.profile_picture_uuid}`}
                    className="object-cover rounded-full aspect-square max-w-[48px]"
                  />
                ) : (
                  <img
                    alt=""
                    src="/images/default_profile_picture.png"
                    className="max-w-[48px]"
                  />
                )}
                <div className="flex flex-col grow pr-2">
                  <div className="flex justify-between">
                    <div className="text-lg font-semibold text-left">
                      {chat.user.username}
                    </div>
                    {chat.message?.created && (
                      <div className="text-sm">
                        {calculateMessageDateDescriptive(
                          new Date(chat.message.created)
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between space-x-4 overflow-hidden text-sm h-6">
                    {chat.message ? (
                      <>
                        <div className="truncate">{`${
                          chat.message.sender_id !== chat.user.id ? "You:" : ""
                        } ${chat.message.message}`}</div>
                        {chat.unreadCount > 0 && (
                          <div
                            className={`flex items-center bg-primary text-sm text-white rounded-full aspect-square ${
                              chat.unreadCount >= 10 ? "px-1" : "px-2"
                            }`}
                          >
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </div>
                        )}
                      </>
                    ) : (
                      <div>New message..</div>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center w-full text-lg">
              You have no chats!
            </div>
          )}
        </div>
      </div>
      {activeChat && (
        <ActiveChat
          chat={activeChat}
          onNewSentMessage={(message) =>
            setChats((prevChats) => {
              return [
                { ...activeChat, message: message },
                ...prevChats.filter((c) => c.id !== activeChat.id),
              ];
            })
          }
          onReadMessages={() => {
            setChats((prevChats) => {
              const idx = chats.findIndex((c) => c.id === activeChat.id);
              return [
                ...prevChats.slice(0, idx),
                { ...activeChat, unreadCount: 0 },
                ...prevChats.slice(idx + 1),
              ];
            });
          }}
          ref={activeChatRef}
          key={activeChat.id}
        />
      )}
    </div>
  );
};

const NewChatDialog = ({ onNewChat }: { onNewChat: (chat: Chat) => void }) => {
  const fetcher = useFetcher();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [friend, setFriend] = useState<Friend | undefined>();

  useEffect(() => {
    const chat = fetcher.data as Chat | null;
    if (chat) {
      onNewChat(chat);
      setIsOpen(false);
    }
    setFetching(false);
  }, [fetcher.data]);

  const newChat = () => {
    setFetching(true);
    const formData = new FormData();
    formData.append("friendId", friend!.id);
    fetcher.submit(formData, {
      method: "POST",
    });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <NewChatIcon className="h-6 w-6" />
      </button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/[0.5]">
          <DialogPanel className="max-w-lg w-2/4 space-y-4 border bg-white p-4 rounded-2xl">
            <DialogTitle className="font-bold text-center flex justify-between items-center">
              <div className="p-1" />
              <div className="text-lg">New chat</div>
              <button
                className="p-1 rounded-full hover:bg-stone-100"
                onClick={() => setIsOpen(false)}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </DialogTitle>
            <FriendsFinder
              fetchingChat={fetching}
              onFriendSelect={(friend) => setFriend(friend)}
            />
            {friend && (
              <div className="w-full flex justify-center">
                <div className="flex space-x-2 items-center w-fit pl-4 pr-2 rounded-3xl bg-secondary">
                  <div className="">{friend.username}</div>
                  <button className="py-1" onClick={() => setFriend(undefined)}>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex">
              <button
                className={`w-full bg-primary text-white py-1 px-3 rounded-xl ${
                  !fetching && friend
                    ? "hover:bg-primary-dark"
                    : "cursor-not-allowed"
                }`}
                onClick={newChat}
                disabled={fetching || !friend}
              >
                {!fetching ? (
                  "Chat"
                ) : (
                  <div className="flex justify-center tracking-widest h-fit">
                    <AnimatedDots />
                  </div>
                )}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

const FriendsFinder = ({
  fetchingChat,
  onFriendSelect,
}: {
  fetchingChat: boolean;
  onFriendSelect: (friend: Friend) => void;
}) => {
  const fetcher = useFetcher();
  const backendUrl = useServerUrl();
  const fetching = useRef<boolean>(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const search = useRef<string>("");
  const cursor = useRef<string>("");
  const hasMore = useRef<boolean>(false);
  const count = useRef<number>(0);
  const newSearch = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const data = fetcher.data as FriendsPagingType | null;
    if (data) {
      const fetcherFriends = data.friends;
      if (!newSearch.current) {
        fetcherFriends.unshift(...fetcherFriends);
      } else {
        count.current = data.count;
        newSearch.current = false;
      }
      setFriends([...fetcherFriends]);
      cursor.current = data.cursor;
      hasMore.current =
        friends.length + fetcherFriends.length !== count.current;
    }
    fetching.current = false;
  }, [fetcher.data]);

  const handleSearch = (e: FormEvent<HTMLInputElement>) => {
    const debounce = 500;
    search.current = e.currentTarget.value;
    newSearch.current = true;
    clearTimeout(timeoutRef.current);
    if (search.current !== "") {
      timeoutRef.current = setTimeout(() => {
        fetching.current = true;
        fetcher.load(
          `/resource/get-friends?search=${search.current}${
            !newSearch.current ? `&cursor=${cursor.current}` : ""
          }`
        );
      }, debounce);
    }
  };
  return (
    <>
      <hr />
      <div className="w-full flex space-x-4">
        <div className="font-semibold text-lg">Friend:</div>
        <input
          className="w-full outline-none"
          type="text"
          onChange={handleSearch}
          placeholder="Search..."
          disabled={fetchingChat}
        />
      </div>
      <hr />
      <div className="flex flex-col h-[28rem] overflow-y-auto scrollbar-thin">
        {friends.map((friend) => (
          <button
            className="hover:bg-stone-100"
            key={friend.id}
            onClick={() => onFriendSelect(friend)}
          >
            <div className="flex items-center space-x-3 p-2">
              {friend.profile_picture_uuid && backendUrl ? (
                <img
                  alt=""
                  src={`${backendUrl}/image/profile_picture/${friend.profile_picture_uuid}`}
                  className="object-cover rounded-full aspect-square max-w-[40px]"
                />
              ) : (
                <img
                  alt=""
                  src="/images/default_profile_picture.png"
                  className="max-w-[40px]"
                />
              )}
              <div className="">{friend.username}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

interface NewMessageHandle {
  receiveMessage: (message: Message) => void;
}
type ChatProps = {
  chat: Chat;
  onNewSentMessage: (message: Message) => void;
  onReadMessages: () => void;
};

const ActiveChat = forwardRef<NewMessageHandle, ChatProps>((props, ref) => {
  const user = useUserData()!;
  const backendUrl = useServerUrl();
  const socket = useContext(SocketContext);
  const fetcher = useFetcher();
  const defaultRows = 1;
  const maxHeight = 200;

  const [rows, setRows] = useState<number>(defaultRows);
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [textAreaFocused, setTextAreaFocused] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessageSeenTime, setLastMessageSeenTime] = useState<string | null>(
    null
  );
  const [isFriendTyping, setIsFriendTyping] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const cursor = useRef<string>();
  const hasMore = useRef<boolean>(true);
  const fetching = useRef<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typingContainerRef = useRef<HTMLDivElement>(null);
  const singleMessage = useRef<boolean>(false);
  const scrollHeight = useRef<number>(0);

  const isTyping = (typing: boolean) => {
    if (
      (!typing &&
        !typingContainerRef.current?.classList.contains("slow-grow")) ||
      (typing &&
        messageContainerRef.current &&
        messageContainerRef.current.scrollTop <= -40)
    ) {
      return;
    }
    const animationDuration = 200;
    if (!typing && typingContainerRef.current) {
      typingContainerRef.current.classList.add("slow-shrink");
      typingContainerRef.current.firstElementChild?.classList.add("slide-out");
      setTimeout(() => {
        setIsFriendTyping(typing);
      }, animationDuration);
    } else {
      setIsFriendTyping(typing);
    }
  };

  useImperativeHandle(ref, () => ({
    receiveMessage(message) {
      singleMessage.current = true;
      if (isFriendTyping) {
        const animationDuration = 200;
        isTyping(false);
        setTimeout(() => {
          setMessages((messages) => [message, ...messages]);
        }, animationDuration);
      } else {
        setMessages((messages) => [message, ...messages]);
        setIsFriendTyping(false);
      }
      if (!textAreaFocused) {
        setUnreadCount((c) => {
          return ++c;
        });
        setLastMessageSeenTime(null);
      } else if (
        textAreaFocused &&
        socket &&
        messageContainerRef.current?.scrollTop === 0
      ) {
        socket.emit("readMessages", {
          chatId: props.chat.id,
          readAt: new Date(),
        });
        props.onReadMessages();
        setUnreadCount(0);
      }
    },
  }));

  const handleReadMessages = useCallback(
    ({ chatId }: { chatId: string }) => {
      if (
        chatId === props.chat.id &&
        messages.length > 0 &&
        messages[0].sender_id === user.id &&
        !lastMessageSeenTime
      ) {
        setLastMessageSeenTime("Seen just now");
      }
    },
    [messages, lastMessageSeenTime]
  );

  useEffect(() => {
    if (socket) {
      const handleFriendTyping = ({
        chatId,
        typing,
      }: {
        chatId: string;
        typing: boolean;
      }) => {
        if (chatId === props.chat.id) {
          isTyping(typing);
        }
      };
      socket.on("userTyping", handleFriendTyping);

      socket.on("readMessages", handleReadMessages);
      return () => {
        socket.off("userTyping", handleFriendTyping);
        socket.off("readMessages", handleReadMessages);
      };
    }
  }, [socket, handleReadMessages]);

  useEffect(() => {
    const messageFetcherData = fetcher.data as MessagesPaging | null;
    if (messageFetcherData) {
      singleMessage.current = false;
      cursor.current = messageFetcherData.cursor;
      hasMore.current =
        messages.length + messageFetcherData.messages.length <
        messageFetcherData.count;
      setMessages((messages) => {
        return [...messages, ...messageFetcherData.messages];
      });
      setLastMessageSeenTime(messageFetcherData.lastMessageReadTime);
    }
    fetching.current = false;
  }, [fetcher.data]);

  useEffect(() => {
    const handleScroll = () => {
      if (messageContainerRef.current) {
        if (messageContainerRef.current.scrollTop !== 0) {
          setShowScrollToBottom(true);
        } else {
          setShowScrollToBottom(false);
        }
        if (
          messageContainerRef.current.scrollHeight >
            messageContainerRef.current.offsetHeight -
              messageContainerRef.current.scrollTop ||
          fetching.current ||
          !hasMore.current
        ) {
          return;
        }
        fetching.current = true;
        fetcher.load(
          `/resource/get-messages?chatId=${props.chat.id}&cursor=${cursor.current}`
        );
      }
    };
    fetcher.load(`/resource/get-messages?chatId=${props.chat.id}`);
    socket?.emit("readMessages", {
      chatId: props.chat.id,
      readAt: new Date(),
    });
    props.onReadMessages();
    const messageRefCurrent = messageContainerRef.current;
    if (messageRefCurrent) {
      messageRefCurrent.addEventListener("scroll", handleScroll);
      return () => {
        messageRefCurrent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useLayoutEffect(() => {
    if (messageContainerRef.current) {
      if (
        singleMessage.current &&
        messageContainerRef.current.scrollTop !== 0
      ) {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollTop -
          (messageContainerRef.current.scrollHeight - scrollHeight.current);
      }
      scrollHeight.current = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTextAreaChange = (e: FormEvent<HTMLTextAreaElement>) => {
    const typingTimeout = 4000;
    setTextAreaValue(e.currentTarget.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = `auto`;
      textAreaRef.current.style.height = `${Math.min(
        textAreaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
    if (socket && textAreaValue < e.currentTarget.value) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("userTyping", {
        chatId: props.chat.id,
        typing: true,
      });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("userTyping", {
          chatId: props.chat.id,
          typing: false,
        });
      }, typingTimeout);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (textAreaValue !== "") sendMessage();
    }
  };

  const onTextAreaFocus = () => {
    if (
      messageContainerRef.current?.scrollTop === 0 &&
      messages.length > 0 &&
      messages[0].sender_id === props.chat.user.id
    ) {
      socket?.emit("readMessages", {
        chatId: props.chat.id,
        readAt: new Date(),
      });
      props.onReadMessages();
      setUnreadCount(0);
    }
    setTextAreaFocused(true);
  };

  const sendMessage = () => {
    const message = {
      sender_id: user.id,
      message: textAreaValue,
      created: new Date().toISOString(),
    };
    setMessages((messages) => {
      return [message, ...messages];
    });
    if (typingContainerRef.current) {
      typingContainerRef.current.scrollIntoView({ behavior: "instant" });
    }
    const newMessage = {
      chatId: props.chat.id,
      message: textAreaValue,
      created: new Date(),
    };
    socket?.emit("message", newMessage, (success: boolean) => {
      if (!success) {
        setMessages((messages) => {
          const errorMessageIdx = messages.indexOf(message);
          if (errorMessageIdx !== -1) messages[errorMessageIdx].error = true;
          return [...messages];
        });
      }
      clearTimeout(typingTimeoutRef.current);
      props.onNewSentMessage(message);
    });
    setLastMessageSeenTime(null);
    setTextAreaValue("");
    setRows(defaultRows);
  };

  const onScrollBottom = () => {
    if (typingContainerRef.current) {
      typingContainerRef.current.scrollIntoView({ behavior: "instant" });
      socket?.emit("readMessages", {
        chatId: props.chat.id,
        readAt: new Date(),
      });
      props.onReadMessages();
      setUnreadCount(0);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex w-full border-b border-secondary p-4 bg-white">
        <div className="flex items-center space-x-2">
          {props.chat.user.profile_picture_uuid && backendUrl ? (
            <img
              alt=""
              src={`${backendUrl}/image/profile_picture/${props.chat.user.profile_picture_uuid}`}
              className="object-cover rounded-full aspect-square max-w-[40px]"
            />
          ) : (
            <img
              alt=""
              src="/images/default_profile_picture.png"
              className="max-w-[40px]"
            />
          )}
          <div className="">{props.chat.user.username}</div>
        </div>
      </div>
      <div
        className="grow flex flex-col-reverse space-y-2 px-8 py-2 overflow-y-auto scrollbar-thin w-full"
        ref={messageContainerRef}
      >
        <div
          className={`${
            isFriendTyping && "slow-grow"
          } self-start relative mt-2`}
          ref={typingContainerRef}
        >
          <div
            className={`${
              isFriendTyping ? "slide-in" : "hidden"
            } absolute top-0 left-0 bg-neutral-200 rounded-md flex space-x-1 font-bold px-2`}
          >
            <AnimatedDots />
          </div>
        </div>

        {lastMessageSeenTime && (
          <div className="self-end text-xs">{lastMessageSeenTime}</div>
        )}
        {messages.map((msg, index) => {
          const message = (
            <div
              className={`max-w-[80%] flex items-center space-x-2 rounded-md p-2 ${
                msg.sender_id === props.chat.user.id
                  ? "self-start bg-zinc-600"
                  : "self-end bg-primary"
              }`}
              key={index}
            >
              <div className="text-white text-sm break-words overflow-hidden">
                {msg.message}
              </div>
              <div className="flex self-end mt-2 *:stroke-white">
                <div className="text-white text-xs">
                  {new Date(msg.created).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>
                {!!msg.error && <ExclamationTriangle className="h-4 w-4" />}
              </div>
            </div>
          );
          const diffFromNow = differenceInCalendarDays(new Date(), msg.created);
          const diffNextMessage =
            index + 1 !== messages.length
              ? differenceInCalendarDays(
                  msg.created,
                  messages[index + 1].created
                )
              : differenceInCalendarDays(new Date(), msg.created) + 1;
          if (diffNextMessage > 0) {
            const newBlockOfMessagesDate =
              diffFromNow > 7
                ? format(
                    new Date(msg.created).toLocaleDateString(),
                    "dd-MM-yyyy"
                  )
                : diffFromNow === 0
                ? "Today"
                : diffFromNow === 1
                ? "Yesterday"
                : format(new Date(msg.created).toLocaleDateString(), "EEEE");
            return (
              <div className="flex flex-col" key={index}>
                <div
                  className={`self-center py-1 px-2 text-xs bg-slate-200 rounded-lg ${
                    index + 1 !== messages.length ? "!my-2" : "!mb-2"
                  }`}
                >
                  {newBlockOfMessagesDate}
                </div>
                {message}
              </div>
            );
          }
          return message;
        })}
      </div>
      <div className="relative flex justify-between p-4 bg-white w-full">
        {showScrollToBottom && (
          <div className="absolute -top-16 left-[50%] -translate-x-[50%]">
            <button
              className="relative bg-white rounded-full p-2"
              onClick={onScrollBottom}
            >
              <ChevronDown className="h-6 w-6 translate-y-0.5" />
              {unreadCount > 0 && (
                <div className="w-fit min-w-6 p-[2px] absolute flex items-center justify-center aspect-square rounded-full bg-primary text-white text-sm top-0 left-full -translate-x-[50%] -translate-y-[50%]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </button>
          </div>
        )}
        <textarea
          ref={textAreaRef}
          rows={rows}
          placeholder="Message"
          className="w-full outline-none resize-none scrollbar-hidden text-base rounded-3xl border border-secondary py-2 px-4 shadow-xl"
          onChange={handleTextAreaChange}
          value={textAreaValue}
          onKeyDown={handleKeyDown}
          onFocus={onTextAreaFocus}
          onBlur={() => setTextAreaFocused(false)}
          disabled={fetcher.state === "loading"}
        />
        <button
          className={`ml-4  ${
            textAreaValue === "" ? "cursor-not-allowed" : "hover:*:fill-primary"
          }`}
          onClick={sendMessage}
          disabled={textAreaValue === ""}
        >
          <PaperAirplaneIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
});
