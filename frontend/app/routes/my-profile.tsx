import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { CommentIcon, ThumbsUpIcon } from "~/components/icons";
import { Friend, FriendsPagingType, getFriends } from "~/service/friendship";
import { getUserPosts, Post, PostPaging } from "~/service/post";
import { me } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, friendsPaging, userPostsPaging] = await Promise.all([
    me(request),
    getFriends(request, null, null),
    getUserPosts(request, null),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json({
    user: user!,
    friendsPaging,
    backendUrl: process.env.BACKEND_URL,
    userPostsPaging,
  });
};

export default () => {
  const { user, backendUrl } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col space-y-8 items-center">
      <div className="flex flex-col bg-white w-full max-h-72 items-center space-y-4 pt-8 fixed top-24 z-10">
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
        <hr className="w-6/12" />
      </div>
      <div className="flex space-x-4 w-6/12 py-4 relative top-72">
        {/* TODO separate into new subroutes */}
        <Friendships />
        <Posts />
      </div>
    </div>
  );
};

const Friendships = () => {
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
        scrollRef.current.scrollHeight !==
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
    <div className="min-w-80 flex flex-col space-y-6 px-2 fixed">
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
      {friends ? (
        friends.length > 0 ? (
          <div
            className="flex flex-col space-y-6 3xl:h-[480px] 4xl:h-[720px] overflow-y-auto"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {friends.map(({ friend }) => (
              <div key={friend.uuid} className="flex items-center space-x-4">
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

const Posts = () => {
  const { user, backendUrl, userPostsPaging } = useLoaderData<typeof loader>();
  const [cursor, setCursor] = useState<number>(userPostsPaging?.cursor ?? 0);
  const [posts, setPosts] = useState<Post[]>(userPostsPaging?.posts ?? []);
  const [fetching, setFetching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(
    posts.length !== (userPostsPaging?.count ?? 0)
  );
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
      setFetching(true);
      fetcher.load(`/resource/get-user-posts?cursor=${cursor}`);
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        console.log(fetching);
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [fetching, hasMore]);

  useEffect(() => {
    setFetching(false);
    const fetcherPostPaging = fetcher.data as PostPaging | null;
    if (fetcherPostPaging) {
      setPosts((posts) => [...posts, ...fetcherPostPaging.posts]);
      setCursor(fetcherPostPaging.cursor);
      setHasMore(
        posts.length + fetcherPostPaging.posts.length !==
          fetcherPostPaging.count
      );
    }
  }, [fetcher.data]);

  return (
    <div className="basis-3/4 pr-4 pl-8 relative left-80">
      {posts ? (
        posts.length > 0 ? (
          <div className="flex flex-col space-y-12 max-h-[100%] overflow-y-auto">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col space-y-4 p-2 border border-slate-300 rounded-lg"
              >
                <div className="flex flex-col space-y-0.5">
                  <div className="flex items-center space-x-2">
                    {user.profile_picture_uuid && backendUrl ? (
                      <div className="rounded-full overflow-hidden aspect-square max-w-[50px]">
                        <img
                          alt=""
                          src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
                          className="object-cover min-h-full"
                        />
                      </div>
                    ) : (
                      <div className="overflow-hidden max-w-[50px]">
                        <img alt="" src="/images/default_profile_picture.png" />
                      </div>
                    )}
                    <div className="text-xl">{user.username}</div>
                  </div>
                  <div className="italic text-sm">{post.created}</div>
                </div>
                <div>{post.text}</div>
                <div className="flex justify-between">
                  <div className="flex space-x-2 items-center">
                    <ThumbsUpIcon classname="w-5 h-5 fill-primary" />
                    <span>{post._count.likes}</span>
                  </div>
                  <div className="flex space-x-2 items-center">
                    <span>{post._count.comments}</span>
                    <CommentIcon className="w-5 h-5 fill-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-4xl text-center">
            You have yet to publish a post...
          </div>
        )
      ) : (
        <div className="text-4xl text-center">
          Error occured fetching posts...
        </div>
      )}
    </div>
  );
};
