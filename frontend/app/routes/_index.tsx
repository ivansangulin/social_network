import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect, useRef, useContext, FormEvent } from "react";
import { Chats } from "~/components/chat";
import { Post } from "~/components/post";
import { SetPostsContext, SocketContext } from "~/root";
import { Friend, getMyFriends } from "~/service/friendship";
import { getMainPagePosts, PostPaging, Post as PostType } from "~/service/post";
import { me } from "~/service/user";

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
  const [chats, setChats] = useState<ChatData[]>([]);
  return (
    <div className="grow flex justify-center">
      <div className="w-6/12 relative flex justify-center">
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
    </div>
  );
}

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
      fetcher.load(`/resource/main-page-posts?cursor=${cursor.current}`);
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
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
    <div className="w-full" ref={postContainerRef}>
      <div className="mx-auto w-8/12 3xl:w-6/12 flex flex-col justify-center py-4 space-y-12">
        <CreatePost onNewPost={onNewPost} />
        {posts ? (
          posts.length > 0 && (
            <SetPostsContext.Provider value={setPosts}>
              <div className="flex flex-col space-y-12">
                {posts.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
            </SetPostsContext.Provider>
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
