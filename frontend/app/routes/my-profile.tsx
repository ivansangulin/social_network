import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { NewsPaperIcon, UserGroupIcon } from "~/components/icons";
import { me } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await me(request);
  if (!user) {
    return redirect("/login");
  }
  const pathname = new URL(request.url).pathname;
  if (pathname.includes("posts") || pathname.includes("friendships")) {
    return json({ user, backendUrl: process.env.BACKEND_URL });
  }
  return redirect("/my-profile/posts");
};

export default () => {
  const { user, backendUrl } = useLoaderData<typeof loader>();
  const pathname = useLocation().pathname;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col bg-white w-full h-fit items-center space-y-4 pt-8">
        {user.profile_picture_uuid && backendUrl ? (
          <div className="rounded-full overflow-hidden aspect-square max-w-[150px]">
            <img
              alt=""
              src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
              className="object-cover min-h-full"
            />
          </div>
        ) : (
          <div className="overflow-hidden max-w-[150px]">
            <img alt="" src="/images/default_profile_picture.png" />
          </div>
        )}
        <div className="text-2xl text-center w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1">
          {user.username}
        </div>
        <div className="flex w-4/12 text-center border-b-2 border-primary text-2xl">
          <Link
            to={"/my-profile/posts"}
            className={`flex space-x-2 justify-center items-center px-4 border-r-2 border-primary basis-1/2 ${
              pathname.includes("posts") ? "fill-primary text-primary" : ""
            }`}
          >
            <div>Posts</div>
            <NewsPaperIcon />
          </Link>
          <Link
            to={"/my-profile/friendships"}
            className={`flex space-x-2 justify-center items-center px-4 basis-1/2 ${
              pathname.includes("friendships")
                ? "fill-primary text-primary"
                : ""
            }`}
          >
            <div>Friendships</div>
            <UserGroupIcon />
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center space-x-4 w-6/12 py-4">
        <Outlet />
      </div>
    </div>
  );
};
