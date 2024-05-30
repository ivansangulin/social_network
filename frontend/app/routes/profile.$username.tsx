import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { redirect } from "react-router";
import { MyProfile, UserProfile } from "~/components/profile";
import {
  ErrorType,
  getUserProfileData,
  me,
  MyData,
  UserData,
} from "~/service/user";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { username } = params;
  const myData = await me(request);
  if (!myData) {
    return redirect("/login");
  }
  if (username === myData.username) {
    return json({ myData, backendUrl: process.env.BACKEND_URL });
  } else {
    const { userData, error } = await getUserProfileData(request, username!);
    if (userData && userData) {
      return json({ userData, backendUrl: process.env.BACKEND_URL });
    } else {
      return json({ error });
    }
  }
};

export default () => {
  const {
    myData,
    userData,
    backendUrl,
    error,
  }: {
    myData?: MyData;
    userData?: UserData;
    backendUrl: string;
    error?: ErrorType;
  } = useLoaderData<typeof loader>();

  return (
    <>
      {myData ? (
        <MyProfile user={myData} backendUrl={backendUrl} />
      ) : userData ? (
        <UserProfile userData={userData} backendUrl={backendUrl} />
      ) : (
        <div className="grow flex flex-col justify-center items-center space-y-4">
          <div className="text-bold text-6xl">{error?.status}</div>
          <div className="text-bold text-6xl">{error?.errorMessage}</div>
        </div>
      )}
    </>
  );
};
