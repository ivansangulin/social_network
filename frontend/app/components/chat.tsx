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
} from "react";
import { SocketContext } from "~/root";
import { Message, MessagesPagingType } from "~/service/chat";
import {
  ChevronDoubleUp,
  ChevronDoubleDown,
  XMarkIcon,
  PaperAirplaneIcon,
} from "./icons";
import { FriendData } from "~/routes/_index";

export const Chats = ({
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

  const organizeChats = useCallback(() => {
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
  }, [friends, popoverChats.length]);

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

  const cursor = useRef<number>();
  const hasMore = useRef<boolean>(true);
  const fetching = useRef<boolean>(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

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
    const messageFetcherData = messageFetcher.data as MessagesPagingType;
    if (messageFetcherData) {
      cursor.current = messageFetcherData.cursor;
      hasMore.current =
        messages.length + messageFetcherData.messages.length !==
        messageFetcherData.count;
      setMessages((messages) => {
        return [...messages, ...messageFetcherData.messages];
      });
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
          !hasMore
        ) {
          return;
        }
        fetching.current = true;
        messageFetcher.load(
          `/resource/get-messages?friendUuid=${friend.uuid}&cursor=${cursor.current}`
        );
      }
    };
    const messageRefCurrent = messageContainerRef.current;
    if (messageRefCurrent) {
      messageRefCurrent.addEventListener("scroll", handleScroll);
      return () => {
        messageRefCurrent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

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
          <div
            className="h-72 flex flex-col-reverse space-y-2 p-4 overflow-y-auto scrollbar-thin"
            ref={messageContainerRef}
          >
            <div ref={messageRef} />
            {messages.map((msg, index) => (
              <div
                className={`max-w-[80%] bg-primary text-white rounded-md text-sm break-words p-2 ${
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
