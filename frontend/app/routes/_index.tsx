import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { me, User } from "~/service/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await me(request);
  if (!user) {
    return redirect("/login");
  }
  return json({ user, backendUrl: process.env.BACKEND_URL });
};

export default function Index() {
  const { user, backendUrl } = useLoaderData<typeof loader>();
  return (
    <div className="grow flex">
      <div className="grow basis-1/5 border-r border-slate-400"></div>
      <div className="grow basis-3/5 border-r border-slate-400"></div>
      <div className="grow basis-1/5 p-4">
        <ProfileData user={user} backendUrl={backendUrl} />
      </div>
    </div>
  );
}

const ProfileData = ({
  user,
  backendUrl,
}: {
  user: User;
  backendUrl: string | undefined;
}) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      {user.profile_picture_uuid && backendUrl ? (
        <Link
          to={"/my-profile"}
          className="rounded-full overflow-hidden aspect-square max-w-[150px]"
        >
          <img
            alt=""
            src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
            className="object-cover min-h-full"
          />
        </Link>
      ) : (
        <Link to={"/my-profile"} className="overflow-hidden max-w-[150px]">
          <img alt="" src="/images/default_profile_picture.png" />
        </Link>
      )}
      <Link
        to={"/my-profile"}
        className="text-2xl text-center min-w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1"
      >
        {user.username}
      </Link>
    </div>
  );
};
