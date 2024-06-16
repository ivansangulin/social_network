import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Link, useFetcher } from "@remix-run/react";
import { useServerUrl } from "~/hooks/useServerUrl";
import { SearchIcon, XMarkCircleIcon } from "./icons";
import { MouseEvent, useRef, useState, FormEvent, useEffect } from "react";
import { AnimatedDots } from "./animated-dots";
import { SearchUser, SearchUsersPaging } from "~/service/user";

export const Search = ({
  onMouseDownSvg,
  onMouseUpSvg,
}: {
  onMouseDownSvg: (e: MouseEvent<HTMLButtonElement>) => void;
  onMouseUpSvg: (e: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const fetcher = useFetcher();
  const backendUrl = useServerUrl();
  const [search, setSearch] = useState<string>("");
  const [showDeleteButton, setShowDeleteButton] = useState<boolean>(false);
  const [users, setUsers] = useState<SearchUser[]>([]);

  const cursor = useRef<string>("");
  const hasMore = useRef<boolean>(false);
  const count = useRef<number>(0);
  const newSearch = useRef<boolean>(false);
  const fetching = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const usersContainerRef = useRef<HTMLDivElement>(null);

  const debounce = 500;

  useEffect(() => {
    const handleScroll = () => {
      if (usersContainerRef.current) {
        if (
          usersContainerRef.current.scrollHeight >
            usersContainerRef.current.offsetHeight -
              usersContainerRef.current.scrollTop ||
          fetching.current ||
          !hasMore.current
        ) {
          return;
        }
        fetching.current = true;
        newSearch.current = false;
        fetcher.load(
          `/resource/get-users?search=${search}${
            !newSearch.current ? `&cursor=${cursor.current}` : ""
          }`
        );
      }
    };
    const usersContainerCurrent = usersContainerRef.current;
    if (usersContainerCurrent) {
      usersContainerCurrent.addEventListener("scroll", handleScroll);
      return () => {
        usersContainerCurrent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const data = fetcher.data as SearchUsersPaging | null;
    if (data) {
      cursor.current = data.cursor;
      if (!newSearch.current) {
        hasMore.current = users.length + data.users.length < count.current;
        setUsers((prevUsers) => {
          return [...prevUsers, ...data.users];
        });
      } else {
        hasMore.current = data.users.length < data.count;
        count.current = data.count;
        setUsers(data.users);
      }
    }
    fetching.current = false;
  }, [fetcher.data]);

  const handleSearch = (e: FormEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value;
    setSearch(inputValue);
    newSearch.current = true;
    clearTimeout(timeoutRef.current);
    if (inputValue !== "") {
      timeoutRef.current = setTimeout(() => {
        fetching.current = true;
        fetcher.load(`/resource/get-users?search=${inputValue}`);
      }, debounce);
    } else {
      setUsers([]);
    }
  };

  return (
    <Popover className="h-fit w-full">
      {({ open }) => (
        <>
          <PopoverButton
            className="h-fit w-full flex items-center space-x-4 p-2 outline-none rounded-lg hover:bg-stone-100 [&>svg]:hover:scale-110"
            onMouseDown={onMouseDownSvg}
            onMouseUp={onMouseUpSvg}
            onMouseLeave={(e) => {
              if (e.currentTarget.classList.contains("text-stone-300")) {
                onMouseUpSvg(e);
              }
            }}
          >
            <SearchIcon
              className={`h-8 w-8 stroke-1 stroke-primary transition-transform duration-150 ${
                open ? "stroke-2" : "fill-transparent"
              }`}
            />
            <div className="text-lg">Search</div>
          </PopoverButton>
          <PopoverPanel className="flex flex-col p-2 rounded-e-3xl absolute top-0 left-full min-w-[28rem] h-svh bg-white border-secondary border-l">
            {({ close }) => (
              <div className="flex flex-col px-2">
                <div className="text-xl font-semibold py-2">Search</div>
                <hr />
                <div className="w-full relative">
                  <input
                    type="text"
                    className="w-full bg-secondary rounded-2xl min-h-8 py-2 px-4 my-2 outline-none peer"
                    placeholder="Search"
                    value={search}
                    onChange={handleSearch}
                    onFocus={() => setShowDeleteButton(true)}
                  />
                  <div className="flex items-center absolute right-3 top-1/2 -translate-y-1/2 z-10">
                    {fetcher.state !== "idle" ? (
                      <div className="h-5 w-5 flex">
                        <AnimatedDots />
                      </div>
                    ) : (
                      showDeleteButton && (
                        <button
                          onClick={() => {
                            setShowDeleteButton(false);
                            setSearch("");
                            setUsers([]);
                          }}
                        >
                          <XMarkCircleIcon className="h-5 w-5 stroke-stone-400" />
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div
                  className="flex flex-col overflow-y-auto scrollbar-thin"
                  ref={usersContainerRef}
                >
                  {users.map((user) => (
                    <Link
                      className="flex items-center space-x-4 w-full py-2 px-4 rounded-2xl hover:bg-stone-100"
                      to={`/profile/${user.username}/posts`}
                      key={user.username}
                      onClick={() => close()}
                    >
                      {user.profile_picture_uuid && backendUrl ? (
                        <img
                          alt=""
                          src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
                          className="object-cover rounded-full aspect-square max-w-[40px]"
                        />
                      ) : (
                        <img
                          alt=""
                          src="/images/default_profile_picture.png"
                          className="max-w-[40px]"
                        />
                      )}
                      <div className="">{user.username}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};
