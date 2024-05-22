import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect, ChangeEvent } from "react";
import { Chats } from "~/components/chat";
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

export type FriendData = {
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
      <div className="basis-3/5 border-r border-slate-400 relative flex justify-center">
        <Posts />
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
    <div className="basis-1/5 border-r border-slate-400 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
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
                <button
                  key={friend.uuid}
                  className="flex items-center space-x-2 rounded-md p-2 hover:bg-slate-100 text-left bg-white"
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
                </button>
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

const Posts = () => {
  return (
    <div className="w-8/12 3xl:w-6/12 flex justify-center py-4">
      <CreatePost />
    </div>
  );
};

const CreatePost = () => {
  const { user, backendUrl } = useLoaderData<typeof loader>();
  const [text, setText] = useState<string>();
  const maxRows = 4;
  const defaultRows = 1;
  const defaultPictureWidth = 40;
  const fetcher = useFetcher();

  useEffect(() => {
    setText("");
  }, [fetcher.data]);

  return (
    <fetcher.Form
      action="resource/create-post"
      method="POST"
      className="w-full h-fit bg-white"
    >
      <div className="border p-4 rounded-md space-y-4">
        <div className="flex space-x-4 items-start">
          <div
            className={`rounded-full overflow-hidden aspect-square max-w-[${defaultPictureWidth}px]`}
          >
            {user.profile_picture_uuid ? (
              <img
                alt=""
                src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
                className="object-cover min-h-full"
              />
            ) : (
              <img alt="" src="/images/default_profile_picture.png" />
            )}
          </div>
          <textarea
            name="text"
            className={`w-full h-[${defaultPictureWidth}px] outline-none resize-none scrollbar-hidden text-base border p-2 rounded-md transition-height`}
            value={text}
            onChange={(e) => {
              setText(e.currentTarget.value);
            }}
            rows={defaultRows}
            placeholder="What's on your mind?"
            required
            onFocus={(e) => {
              e.currentTarget.style.height = `${
                (maxRows - 1) * defaultPictureWidth
              }px`;
            }}
            onBlur={(e) => {
              if (e.currentTarget.textLength === 0)
                e.currentTarget.style.height = `${defaultPictureWidth}px`;
            }}
          />
        </div>
        <hr />
        <div className="flex justify-end items-center">
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white rounded-sm px-8 py-1 min-w-[100px]"
          >
            {fetcher.state === "submitting" ? (
              <div className="animate-bounce">...</div>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </div>
    </fetcher.Form>
  );
};
