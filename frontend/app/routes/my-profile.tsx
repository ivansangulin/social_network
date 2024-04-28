import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Friend, FriendsPagingType, getFriends } from "~/service/friendship";
import { me } from "~/service/user";

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

export default () => {
  const { user, backendUrl } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col space-y-8 items-center">
      <div className="flex flex-col items-center space-y-4 mt-8">
        {user.profile_picture_uuid && backendUrl ? (
          <div className="rounded-full overflow-hidden aspect-square max-w-[200px]">
            <img
              alt=""
              src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
              className="object-cover min-h-full"
            />
          </div>
        ) : (
          <div className="overflow-hidden max-w-[200px]">
            <img alt="" src="/images/default_profile_picture.png" />
          </div>
        )}
        <div className="text-2xl text-center w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1">
          {user.username}
        </div>
      </div>
      <hr className="w-6/12" />
      <div className="flex space-x-8 w-6/12">
        <FriendShips />
        <div className="basis-3/4"></div>
      </div>
    </div>
  );
};

const FriendShips = () => {
  const { friendsPaging, backendUrl } = useLoaderData<typeof loader>();
  const [count, setCount] = useState<number>(friendsPaging?.count ?? 0);
  const [cursor, setCursor] = useState<number>(friendsPaging?.cursor ?? 0);
  const [friends, setFriends] = useState<Friend[]>(
    friendsPaging?.friends ?? []
  );
  const [search, setSearch] = useState<string>("");
  const [fetching, setFetching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(friends.length !== count);
  const [newSearch, setNewSearch] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();

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
      setCount(fetcherFriendsPaging.count);
      setCursor(fetcherFriendsPaging.cursor);
      setHasMore(fetcherFriends.length !== fetcherFriendsPaging.count);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (newSearch) {
      fetch();
    }
  }, [newSearch]);

  const handleScroll = () => {
    if (scrollRef.current) {
      if (
        scrollRef.current.scrollHeight -
          scrollRef.current.children[0].clientHeight >
          scrollRef.current.offsetHeight + scrollRef.current.scrollTop ||
        fetching ||
        !hasMore
      ) {
        return;
      }
      fetch();
    }
  };

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
    <div className="basis-1/4 flex flex-col space-y-6 px-2">
      <div className="flex space-x-4 items-center">
        <div className="text-2xl">My friends</div>
        {fetching && <div className="animate-bounce">...</div>}
      </div>
      <input
        type="text"
        className="rounded-lg min-h-12 px-4 border border-slate-300"
        placeholder="Search friends by username..."
        onChange={handleNewSearch}
      />
      {friendsPaging?.friends ? (
        friends.length > 0 ? (
          <>
            <div
              className="flex flex-col space-y-6 max-h-[600px] overflow-y-auto"
              ref={scrollRef}
              onScroll={() => {
                handleScroll();
              }}
            >
              {friends.map(({ friend }) => (
                <div key={friend.uuid} className="flex items-center space-x-4">
                  {friend.profile_picture_uuid ? (
                    <div className="rounded-full overflow-hidden aspect-square max-w-[100px]">
                      <img
                        alt=""
                        src={`${backendUrl}/image/profile_picture/${friend.profile_picture_uuid}`}
                        className="object-cover min-h-full"
                      />
                    </div>
                  ) : (
                    <div className="overflow-hidden max-w-[50px]">
                      <img alt="" src="/images/default_profile_picture.png" />
                    </div>
                  )}
                  <div className="text-xl">{friend.username}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-4xl text-center">No friends found...</div>
        )
      ) : (
        <div className="text-4xl text-center">
          Error occured fetching friends...
        </div>
      )}
    </div>
  );
};
