import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { getUserPosts, Post as PostType, PostPaging } from "~/service/post";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { me } from "~/service/user";
import { Post } from "~/components/post";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [user, userPostsPaging] = await Promise.all([
    me(request),
    getUserPosts(request, null),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json({
    user: user!,
    backendUrl: process.env.BACKEND_URL,
    userPostsPaging,
  });
};

export default () => {
  const { backendUrl, userPostsPaging } = useLoaderData<typeof loader>();
  const [cursor, setCursor] = useState<number>(userPostsPaging?.cursor ?? 0);
  const [posts, setPosts] = useState<PostType[]>(userPostsPaging?.posts ?? []);
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
    <div className="w-8/12">
      {posts ? (
        posts.length > 0 ? (
          <div className="flex flex-col space-y-12 max-h-[100%]">
            {posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                backendUrl={backendUrl}
              />
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
