import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Post } from "~/components/post";
import { getPost } from "~/service/post";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const postId = params.postId!;
  const post = await getPost(request, postId);
  return json(post);
};

export default () => {
  const post = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto mt-4 w-3/12">
      {post ? (
        <Post post={post} />
      ) : (
        <div className="text-6xl">No post found!</div>
      )}
    </div>
  );
};
