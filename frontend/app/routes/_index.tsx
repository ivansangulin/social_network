import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, useFetcher, useLoaderData } from "@remix-run/react";
import {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  useContext,
  FormEvent,
} from "react";
import { Chats } from "~/components/chat";
import { Post } from "~/components/post";
import { SocketContext } from "~/root";
import { Friend, FriendsPagingType, getMyFriends } from "~/service/friendship";
import { getMainPagePosts, PostPaging, Post as PostType } from "~/service/post";
import { me, MyData } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, friendsPaging, postsPaging] = await Promise.all([
    me(request),
    getMyFriends(request, null, null),
    getMainPagePosts(request, null),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json({
    user: user!,
    friendsPaging,
    postsPaging,
    backendUrl: process.env.BACKEND_URL,
  });
};

export type ChatData = {
  defaultOpen: boolean;
  notification: boolean;
  friend: Friend;
};

export default function Index() {
  const { user, backendUrl } = useLoaderData<typeof loader>();
  const [chats, setChats] = useState<ChatData[]>([]);
  return (
    <div className="grow flex">
      <Friends
        onNewChat={(friend) => {
          if (chats.find((c) => c.friend.id === friend.id)) return;
          setChats((chats) => {
            return [
              { defaultOpen: true, notification: false, friend },
              ...chats,
            ];
          });
        }}
      />
      <div className="basis-3/5 border-r border-slate-400 relative flex justify-center">
        <Posts />
        <Chats
          chats={chats}
          onDeleteChat={(id) => {
            setChats((chats) => {
              return [...chats.filter((c) => c.friend.id !== id)];
            });
          }}
          setFirst={(id) => {
            const el = chats.find((c) => c.friend.id === id)!;
            setChats([el, ...chats.filter((c) => c.friend.id !== id)]);
          }}
          onNewChat={(friend) => {
            setChats((chats) => {
              return [
                { defaultOpen: false, notification: true, friend },
                ...chats,
              ];
            });
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
  user: MyData;
  backendUrl: string | undefined;
}) => {
  return (
    <div className="basis-1/5 p-4">
      <div className="flex flex-col items-center space-y-2">
        {user.profile_picture_uuid && backendUrl ? (
          <img
            alt=""
            src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
            className="object-cover rounded-full aspect-square max-w-[150px]"
          />
        ) : (
          <img
            alt=""
            src="/images/default_profile_picture.png"
            className="max-w-[150px]"
          />
        )}
        <Link
          to={`/profile/${user.username}/posts`}
          className="text-2xl text-center min-w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1"
        >
          {user.username}
        </Link>
      </div>
    </div>
  );
};

type UserActivity = { id: string; status: boolean };

const Friends = ({ onNewChat }: { onNewChat: (friend: Friend) => void }) => {
  const socket = useContext(SocketContext);
  const { friendsPaging, backendUrl } = useLoaderData<typeof loader>();
  const [cursor, setCursor] = useState<string>(friendsPaging?.cursor ?? "");
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
    if (socket) {
      const handleUserActivity = (activity: UserActivity) => {
        setFriends((friends) => {
          const friend = friends.find((f) => f.id === activity.id);
          if (friend) {
            friend.user_status.is_online = activity.status;
            friend.user_status.last_seen = "Just now";
          }
          return [...friends];
        });
      };
      socket.on("userActivity", handleUserActivity);
      return () => {
        socket.off("userActivity", handleUserActivity);
      };
    }
  }, [socket]);

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
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-slate-100 text-left"
                  onClick={() => {
                    onNewChat(friend);
                  }}
                >
                  <div className="flex items-center space-x-2">
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
                  <div className="flex items-center space-x-2 pr-2">
                    {!friend.user_status.is_online && (
                      <div className="text-neutral-400 pb-1">
                        {friend.user_status.last_seen}
                      </div>
                    )}
                    <div
                      className={`w-[10px] h-[10px] rounded-full ${
                        friend.user_status.is_online
                          ? "bg-green-500"
                          : "bg-neutral-400"
                      }`}
                    />
                  </div>
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
  const { postsPaging } = useLoaderData<typeof loader>();
  const cursor = useRef<string>(postsPaging?.cursor ?? "");
  const [posts, setPosts] = useState<PostType[]>(postsPaging?.posts ?? []);
  const postContainerRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();
  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(
    postsPaging ? postsPaging.count > posts.length : false
  );

  useEffect(() => {
    const handleScroll = () => {
      if (postContainerRef.current) {
        if (
          postContainerRef.current.scrollHeight >
            postContainerRef.current.offsetHeight +
              postContainerRef.current.scrollTop ||
          fetching.current ||
          !hasMore.current
        ) {
          return;
        }
        fetching.current = true;
        fetcher.load(`/resource/main-page-posts?cursor=${cursor.current}`);
      }
    };
    const postContainerCurrent = postContainerRef.current;
    if (postContainerCurrent) {
      postContainerCurrent.addEventListener("scroll", handleScroll);
      return () => {
        postContainerCurrent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const data = fetcher.data as PostPaging | null;
    if (data && postsPaging) {
      cursor.current = data.cursor;
      hasMore.current = posts.length + data.posts.length < postsPaging.count;
      setPosts((posts) => {
        return [...posts, ...data.posts];
      });
    }
    fetching.current = false;
  }, [fetcher.data]);

  const onNewPost = (post: PostType) => {
    setPosts((posts) => {
      return [post, ...posts];
    });
  };

  return (
    <div
      className="w-full max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin"
      ref={postContainerRef}
    >
      <div className="mx-auto w-8/12 3xl:w-6/12 flex flex-col justify-center py-4 space-y-12">
        <CreatePost onNewPost={onNewPost} />
        {posts ? (
          posts.length > 0 && (
            <div className="flex flex-col space-y-12">
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          )
        ) : (
          <div className="text-4xl text-center">
            Error occured fetching posts...
          </div>
        )}
      </div>
    </div>
  );
};

const CreatePost = ({ onNewPost }: { onNewPost: (post: PostType) => void }) => {
  const socket = useContext(SocketContext);
  const { user, backendUrl } = useLoaderData<typeof loader>();
  const [text, setText] = useState<string>();
  const [creating, setCreating] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const maxRows = 4;
  const defaultRows = 1;
  const defaultPictureWidth = 42;

  useEffect(() => {
    if (socket) {
      const handleNewPost = ({ post }: { post: PostType | string }) => {
        if (typeof post !== "string" && textAreaRef.current) {
          onNewPost(post);
          setText("");
          textAreaRef.current.style.height = `${defaultPictureWidth}px`;
        }
      };
      socket.on("newPost", handleNewPost);
      return () => {
        socket.off("newPost", handleNewPost);
      };
    }
  }, [socket]);

  const createPost = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    socket?.emit("newPost", text, (finished: boolean) =>
      setCreating(!finished)
    );
  };

  return (
    <Form className="w-full h-fit" onSubmit={createPost}>
      <div className="border p-4 rounded-md space-y-4 bg-white">
        <div className="flex space-x-4 items-start">
          <div
            className="rounded-full overflow-hidden aspect-square"
            style={{ maxWidth: `${defaultPictureWidth}px` }}
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
            className="w-full outline-none resize-none scrollbar-hidden text-base border py-2 px-3 rounded-2xl transition-height"
            style={{ height: `${defaultPictureWidth}px` }}
            value={text}
            defaultValue={text}
            rows={defaultRows}
            ref={textAreaRef}
            placeholder="What's on your mind?"
            required
            onChange={(e) => {
              setText(e.currentTarget.value);
            }}
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
            {creating ? <div className="animate-bounce">...</div> : "Post"}
          </button>
        </div>
      </div>
    </Form>
  );
};
