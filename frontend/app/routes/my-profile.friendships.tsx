import { useLoaderData, useFetcher, json, redirect } from "@remix-run/react";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { Friend, FriendsPagingType, getFriends } from "~/service/friendship";
import { LoaderFunctionArgs } from "@remix-run/node";
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
  const { friendsPaging, backendUrl } = useLoaderData<typeof loader>();
  const [friends, setFriends] = useState<Friend[]>(
    friendsPaging?.friends ?? []
  );

  const search = useRef<string>("");
  const cursor = useRef<number>(friendsPaging?.cursor ?? 0);
  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(
    friends.length !== (friendsPaging?.count ?? 0)
  );
  const newSearch = useRef<boolean>(false);

  const fetcher = useFetcher();

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
      fetch();
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const fetcherFriendsPaging = fetcher.data as FriendsPagingType | null;
    if (fetcherFriendsPaging) {
      const fetcherFriends = fetcherFriendsPaging.friends;
      if (!newSearch.current) {
        fetcherFriends.unshift(...friends);
      } else {
        newSearch.current = false;
      }
      setFriends([...fetcherFriends]);
      cursor.current = fetcherFriendsPaging.cursor;
      hasMore.current =
        friends.length + fetcherFriends.length !== fetcherFriendsPaging.count;
    }
    fetching.current = false;
  }, [fetcher.data]);

  const fetch = () => {
    fetching.current = true;
    fetcher.load(
      `/resource/get-friends?search=${search.current}${
        !newSearch.current ? `&cursor=${cursor.current}` : ""
      }`
    );
  };

  const handleNewSearch = (e: ChangeEvent<HTMLInputElement>) => {
    search.current = e.currentTarget.value;
    newSearch.current = true;
    fetch();
  };

  return (
    <div className="flex flex-col space-y-6 w-10/12 items-center">
      <div className="flex relative space-x-4 items-center w-6/12">
        <input
          type="text"
          className="rounded-lg min-h-12 px-4 border border-slate-300 w-full"
          placeholder="Search friends by username..."
          onChange={handleNewSearch}
          />
          {fetcher.state === "loading" && (
            <div className="animate-bounce absolute -right-6">...</div>
          )}
      </div>
      {friends ? (
        friends.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 max-h-[100%] min-w-full">
            {friends.map((friend) => (
              <div
                key={friend.uuid}
                className="flex items-center space-x-4 border-2 border-slate-300 rounded-md col-span-1 p-2"
              >
                {friend.profile_picture_uuid && backendUrl ? (
                  <div className="rounded-full overflow-hidden aspect-square max-w-[50px]">
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
