import { Dialog, DialogPanel } from "@headlessui/react";
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useOutletContext } from "@remix-run/react";
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
  const { dialog } = useOutletContext<{ dialog: true }>();
  const navigate = useNavigate();

  return (
    <>
      {dialog ? (
        <Dialog
          open={true}
          onClose={() => {
            navigate("/", { preventScrollReset: true });
          }}
          className="relative z-40"
        >
          <div className="fixed inset-0 flex w-screen items-center justify-center py-4 bg-black/[0.5]">
            <DialogPanel className="h-[90vh] max-w-xl w-full bg-white rounded-2xl">
              {post ? (
                <Post post={post} />
              ) : (
                <div className="text-6xl">No post found!</div>
              )}
            </DialogPanel>
          </div>
        </Dialog>
      ) : (
        <div className="flex items-center max-w-xl w-full">
          {post ? (
            <Post post={post} />
          ) : (
            <div className="text-6xl">No post found!</div>
          )}
        </div>
      )}
    </>
  );
};
