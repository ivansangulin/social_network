import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { Post } from "~/components/post";
import { useUserData } from "~/hooks/useUserData";
import { SetPostsContext } from "~/root";
import { getUserPosts, PostPaging, Post as PostType } from "~/service/post";
import { getCookie, me } from "~/service/user";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const cursor = searchParams.get("cursor");
  const { username } = params;
  const cookie = getCookie(request);
  if (!cookie) {
    return redirect("/login");
  }
  const [user, userPostsPaging] = await Promise.all([
    me(request, cookie),
    getUserPosts(cookie, username!, cursor),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json(userPostsPaging);
};

export default () => {
  const userPostsPaging = useLoaderData<typeof loader>();
  const user = useUserData()!;
  const [posts, setPosts] = useState<PostType[]>(userPostsPaging?.posts ?? []);
  const cursor = useRef<string>(userPostsPaging?.cursor ?? "");
  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(
    posts.length !== (userPostsPaging?.count ?? 0)
  );
  const fetcher = useFetcher();
  const { username } = useParams();
  const myProfile = user.username === username;

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
      fetcher.load(`/profile/${username}/posts?cursor=${cursor.current}`);
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const fetcherPostPaging = fetcher.data as PostPaging | null;
    if (fetcherPostPaging) {
      setPosts((posts) => [...posts, ...fetcherPostPaging.posts]);
      cursor.current = fetcherPostPaging.cursor;
      hasMore.current =
        posts.length + fetcherPostPaging.posts.length !==
        fetcherPostPaging.count;
    }
    fetching.current = false;
  }, [fetcher.data]);

  return (
    <div className="max-w-xl w-full">
      {posts ? (
        posts.length > 0 ? (
          <SetPostsContext.Provider value={setPosts}>
            <div className="flex flex-col space-y-12">
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          </SetPostsContext.Provider>
        ) : (
          <div className="text-4xl text-center">
            {myProfile && "You don't have any posts yet..."}
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
