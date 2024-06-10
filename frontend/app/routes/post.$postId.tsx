import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Post } from "~/components/post";
import { getPost } from "~/service/post";
import { me } from "~/service/user";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const postId = params.postId!;
  const [user, post] = await Promise.all([
    me(request),
    getPost(request, postId),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json(post);
};

export default () => {
  const post = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto my-4 w-[30%]">
      {post ? (
        <Post post={post} />
      ) : (
        <div className="text-6xl">No post found!</div>
      )}
    </div>
  );
};
