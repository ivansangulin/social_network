import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { ThumbsUpIcon, CommentIcon } from "~/components/icons";
import { getUserPosts, Post, PostPaging } from "~/service/post";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { me } from "~/service/user";

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
