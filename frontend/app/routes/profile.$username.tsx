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
    return json({ myData });
  } else {
    const { userData, error } = await getUserProfileData(request, username!);
    if (userData && userData) {
      return json({ userData });
    } else {
      return json({ error });
    }
  }
};

export default () => {
  const {
    myData,
    userData,
    error,
  }: {
    myData?: MyData;
    userData?: UserData;
    error?: ErrorType;
  } = useLoaderData<typeof loader>();

  return (
    <>
      {myData ? (
        <MyProfile />
      ) : userData ? (
        <UserProfile userData={userData} />
      ) : (
        <div className="grow flex flex-col justify-center items-center space-y-4">
          <div className="text-bold text-6xl">{error?.status}</div>
          <div className="text-bold text-6xl">{error?.errorMessage}</div>
        </div>
      )}
    </>
  );
};
