import { useFetcher } from "@remix-run/react";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useContext,
  FormEvent,
  MouseEvent,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ServerUrlContext, SocketContext } from "~/root";
import { Message, MessagesPaging } from "~/service/chat";
import {
  ChevronDoubleUp,
  ChevronDoubleDown,
  XMarkIcon,
  PaperAirplaneIcon,
  ExclamationTriangle,
} from "./icons";
import { ChatData } from "~/routes/_index";
import { Friend } from "~/service/friendship";

interface NewMessageHandle {
  receiveMessage: (message: Message) => void;
  isTyping: (typing: boolean) => void;
  readMessages: () => void;
}

type ChatProps = {
  className: string;
  friend: Friend;
  onDeleteChat: () => void;
  inPopover?: boolean;
  defaultOpen: boolean;
  popoverOpen: boolean;
  setFirst?: (id: string) => void;
  closePopover: () => void;
  notification?: boolean;
};

export const Chats = ({
  chats,
  onDeleteChat,
  setFirst,
  onNewChat,
}: {
  chats: ChatData[];
  onDeleteChat: (id: string) => void;
  setFirst: (id: string) => void;
  onNewChat: (friendData: Friend) => void;
}) => {
  const socket = useContext(SocketContext);
  const [shownChats, setShownChats] = useState<ChatData[]>([]);
  const [popoverChats, setPopoverChats] = useState<ChatData[]>([]);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null);
  const chatRefs = useRef<{
    [key: string]: NewMessageHandle | null;
  }>({});

  const elementWidth = 288;
  const triggerWidth = 40;

  const organizeChats = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const nrOfChatsToShow = Math.floor(
        (containerWidth - triggerWidth) / elementWidth
      );
      if (nrOfChatsToShow > chats.length) {
        setShownChats(chats);
        if (popoverChats.length > 0) setPopoverChats([]);
        setPopoverOpen(false);
      } else {
        setShownChats(chats.slice(0, nrOfChatsToShow));
        setPopoverChats(chats.slice(nrOfChatsToShow));
      }
    }
  }, [chats, popoverChats.length]);

  const closePopover = useCallback(() => {
    if (popoverOpen) {
      setPopoverOpen(false);
    }
  }, [popoverOpen]);

  useEffect(() => {
    if (window) {
      window.addEventListener("resize", organizeChats);
      window.addEventListener("click", closePopover);
      organizeChats();
      return () => {
        window.removeEventListener("resize", organizeChats);
        window.removeEventListener("click", closePopover);
      };
    }
  }, [closePopover, organizeChats]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: Message, friendData: Friend) => {
        const sender = message.sender;
        if (chatRefs.current[sender]) {
          chatRefs.current[sender].receiveMessage(message);
        } else {
          onNewChat(friendData);
        }
      };
      socket.on("message", handleNewMessage);

      const handleFriendTyping = ({
        friendId,
        typing,
      }: {
        friendId: string;
        typing: boolean;
      }) => {
        if (chatRefs.current[friendId]) {
          chatRefs.current[friendId].isTyping(typing);
        }
      };
      socket.on("userTyping", handleFriendTyping);

      const handleReadMessages = ({ friendId }: { friendId: string }) => {
        if (chatRefs.current[friendId]) {
          chatRefs.current[friendId].readMessages();
        }
      };
      socket.on("readMessages", handleReadMessages);
      return () => {
        socket.off("message", handleNewMessage);
        socket.off("userTyping", handleFriendTyping);
        socket.off("readMessages", handleReadMessages);
      };
    }
  }, [socket]);

  return (
    <div
      className="absolute bottom-0 left-0 flex items-end px-2 w-full z-10"
      ref={containerRef}
    >
      {shownChats.map(({ friend, defaultOpen, notification }) => (
        <Chat
          key={friend.id}
          className=""
          friend={friend}
          onDeleteChat={() => onDeleteChat(friend.id)}
          popoverOpen={popoverOpen}
          defaultOpen={defaultOpen}
          closePopover={closePopover}
          ref={(el) => (chatRefs.current[friend.id] = el)}
          notification={notification}
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
              {popoverChats.map(({ friend }) => (
                <Chat
                  key={friend.id}
                  className="px-4"
                  friend={friend}
                  onDeleteChat={() => onDeleteChat(friend.id)}
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

const Chat = forwardRef<NewMessageHandle, ChatProps>((props, ref) => {
  const socket = useContext(SocketContext);
  const serverUrl = useContext(ServerUrlContext);
  const maxRows = 5;
  const defaultRows = 1;
  const colsDefault = 24;

  const [open, setOpen] = useState<boolean>(props.defaultOpen);
  const [rows, setRows] = useState<number>(defaultRows);
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<number>(
    props.notification ? 1 : 0
  );
  const [textAreaFocused, setTextAreaFocused] = useState<boolean>(false);
  const [isFriendTyping, setIsFriendTyping] = useState<boolean>(false);
  const [lastMessageSeenTime, setLastMessageSeenTime] = useState<string | null>(
    null
  );

  const messageFetcher = useFetcher();

  const cursor = useRef<string>();
  const hasMore = useRef<boolean>(true);
  const fetching = useRef<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const typingContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    receiveMessage(message) {
      if (isFriendTyping) {
        const animationDuration = 200;
        this.isTyping(false);
        setTimeout(() => {
          setMessages((messages) => [message, ...messages]);
        }, animationDuration);
      } else {
        setMessages((messages) => [message, ...messages]);
        setIsFriendTyping(false);
      }
      if (!textAreaFocused || !open) {
        setNotifications((notifications) => notifications + 1);
        setLastMessageSeenTime(null);
      } else if (
        textAreaFocused &&
        open &&
        socket &&
        messageContainerRef.current?.scrollTop === 0
      ) {
        socket.emit("readMessages", { friendId: props.friend.id });
      }
    },
    isTyping(typing: boolean) {
      const animationDuration = 200;
      if (!typing && typingContainerRef.current) {
        typingContainerRef.current.classList.add("slow-shrink");
        typingContainerRef.current.firstElementChild?.classList.add(
          "slide-out"
        );
        setTimeout(() => {
          setIsFriendTyping(typing);
        }, animationDuration);
      } else {
        setIsFriendTyping(typing);
      }
    },
    readMessages() {
      setLastMessageSeenTime("Seen just now");
    },
  }));

  useEffect(() => {
    if (props.popoverOpen) {
      setOpen(false);
    }
  }, [props.popoverOpen]);

  useEffect(() => {
    const messageFetcherData = messageFetcher.data as MessagesPaging | null;
    if (messageFetcherData) {
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
  }, [messageFetcher.data]);

  useEffect(() => {
    const handleScroll = () => {
      if (messageContainerRef.current) {
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
        messageFetcher.load(
          `/resource/get-messages?friendId=${props.friend.id}&cursor=${cursor.current}`
        );
      }
    };
    messageFetcher.load(
      `/resource/get-messages?friendId=${props.friend.id}`
    );
    const messageRefCurrent = messageContainerRef.current;
    if (messageRefCurrent) {
      messageRefCurrent.addEventListener("scroll", handleScroll);
      return () => {
        messageRefCurrent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  const handleOpenClose = (e: MouseEvent<HTMLButtonElement>) => {
    props.closePopover();
    if (props.inPopover) {
      e.stopPropagation();
      if (props.setFirst) {
        props.setFirst(props.friend.id);
        return;
      }
    }
    setOpen(!open);
  };

  const handleTextAreaChange = (e: FormEvent<HTMLTextAreaElement>) => {
    const typingTimeout = 4000;
    setTextAreaValue(e.currentTarget.value);
    if (rows <= maxRows) {
      const element = e.target as HTMLTextAreaElement;
      const newRows = Math.max(Math.ceil(element.textLength / colsDefault), 1);
      if (newRows <= maxRows && newRows !== rows) setRows(newRows);
    }
    if (socket && textAreaValue < e.currentTarget.value) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("userTyping", {
        friendId: props.friend.id,
        typing: true,
      });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("userTyping", {
          friendId: props.friend.id,
          typing: false,
        });
      }, typingTimeout);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    if (props.inPopover) e.stopPropagation();
    props.onDeleteChat();
  };

  const sendMessage = () => {
    const tempKey = messages.length - 1;
    setMessages((messages) => {
      return [
        {
          sender: `${tempKey}`,
          message: textAreaValue,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        },
        ...messages,
      ];
    });
    if (typingContainerRef.current) {
      typingContainerRef.current.scrollIntoView({ behavior: "instant" });
    }
    const message = {
      friendId: props.friend.id,
      message: textAreaValue,
      created: new Date(),
    };
    socket?.emit("message", message, (success: boolean) => {
      if (!success) {
        setMessages((messages) => {
          const errorMessageIdx = messages.findIndex(
            (v) => Number(v.sender) === tempKey
          );
          if (errorMessageIdx !== -1) messages[errorMessageIdx].error = true;
          return [...messages];
        });
      }
    });
    setLastMessageSeenTime(null);
    setTextAreaValue("");
    setRows(defaultRows);
    clearTimeout(typingTimeoutRef.current);
  };

  const onTextAreaFocus = () => {
    if (notifications > 0 && messageContainerRef.current?.scrollTop === 0) {
      socket?.emit("readMessages", {
        friendId: props.friend.id,
        readAt: new Date(),
      });
      setNotifications(0);
    }
    setTextAreaFocused(true);
  };

  return (
    <div className="w-72 px-1">
      <div
        className={`${props.className} ${
          notifications > 0 && !open && "animation-glow"
        } flex items-center justify-between p-2 bg-primary text-white w-full`}
      >
        <div className="flex items-center space-x-2 overflow-hidden">
          {props.friend.profile_picture_uuid && serverUrl ? (
            <div className="rounded-full overflow-hidden aspect-square max-w-[30px]">
              <img
                alt=""
                src={`${serverUrl}/image/profile_picture/${props.friend.profile_picture_uuid}`}
                className="object-cover min-h-full"
              />
            </div>
          ) : (
            <div className="overflow-hidden max-w-[30px]">
              <img alt="" src="/images/default_profile_picture.png" />
            </div>
          )}
          <button
            className="truncate hover:underline"
            onClick={handleOpenClose}
          >
            {props.friend.username}
          </button>
          {notifications > 0 && (
            <div className="bg-red-600 text-sm text-white rounded-md px-2">
              {notifications > 10 ? "10+" : notifications}
            </div>
          )}
        </div>
        <button onClick={handleDelete}>
          <XMarkIcon />
        </button>
      </div>
      {open && (
        <div className="border-x border-black bg-white">
          <div
            className="h-72 flex flex-col-reverse space-y-2 px-4 py-2 overflow-y-auto scrollbar-thin"
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
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`dot dot-${i + 1} relative`}>
                    .
                  </div>
                ))}
              </div>
            </div>

            {lastMessageSeenTime && (
              <div className="self-end text-xs">{lastMessageSeenTime}</div>
            )}
            {messages.map((msg, index) => (
              <div
                className={`max-w-[80%] flex items-center space-x-2 rounded-md p-2 ${
                  msg.sender === props.friend.id
                    ? "self-start bg-zinc-600"
                    : "self-end bg-primary"
                }`}
                key={index}
              >
                <div className="text-white text-sm break-words overflow-hidden">
                  {msg.message}
                </div>
                <div className="flex self-end mt-2 *:stroke-white">
                  <div className="text-white text-xs">{msg.time}</div>
                  {!!msg.error && <ExclamationTriangle className="h-4 w-4" />}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-black flex justify-between p-2 bg-white">
            <textarea
              rows={rows}
              cols={colsDefault}
              placeholder="Message"
              className="w-full outline-none resize-none scrollbar-hidden text-base"
              onChange={handleTextAreaChange}
              value={textAreaValue}
              onKeyDown={handleKeyDown}
              onFocus={onTextAreaFocus}
              onBlur={() => setTextAreaFocused(false)}
            />
            <button className="ml-2 hover:*:fill-primary" onClick={sendMessage}>
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
