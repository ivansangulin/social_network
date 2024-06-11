import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { Post } from "~/components/post";
import { SetPostsContext } from "~/root";
import {
  getMyPosts,
  getUserPosts,
  PostPaging,
  Post as PostType,
} from "~/service/post";
import { me } from "~/service/user";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await me(request);
  if (!user) {
    return redirect("/login");
  }
  const { username } = params;
  let userPostsPaging;
  if (username === user.username) {
    userPostsPaging = await getMyPosts(request, null);
  } else {
    userPostsPaging = await getUserPosts(request, username!, null);
  }
  return json({
    userPostsPaging,
    user,
  });
};

export default () => {
  const { userPostsPaging, user } = useLoaderData<typeof loader>();
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
      fetcher.load(
        `/resource/get-user-posts?cursor=${cursor.current}${
          !myProfile ? `&username=${username}` : ""
        }`
      );
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
    <div className="w-6/12">
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
            {myProfile
              ? "You don't have any posts yet..."
              : "This user doesn't have any posts..."}
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
