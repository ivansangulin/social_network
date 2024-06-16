import { Link, Outlet, useLocation, useParams } from "@remix-run/react";
import { UserData } from "~/service/user";
import {
  CheckIcon,
  LockClosedIcon,
  NewsPaperIcon,
  UserGroupIcon,
  UserMinusIcon,
  UserPlusIcon,
  XMarkIcon,
} from "./icons";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useServerUrl } from "~/hooks/useServerUrl";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useUserData } from "~/hooks/useUserData";
import { AnimatedDots } from "./animated-dots";

export const MyProfile = () => {
  const pathname = useLocation().pathname;
  const { username } = useParams();

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col bg-white w-full h-fit items-center space-y-4 pt-8">
        <UploadProfilePictureDialog />
        <div className="text-2xl text-center w-[250px] shadow-2xl drop-shadow-2xl rounded-md border border-slate-100 p-1">
          {username}
        </div>
        <div className="flex w-4/12 text-center border-b-2 border-primary text-2xl">
          <Link
            to={`/profile/${username}/posts`}
            className={`flex space-x-2 justify-center items-center px-4 border-r-2 border-primary basis-1/2 ${
              pathname.includes("posts") ? "fill-primary text-primary" : ""
            }`}
          >
            <div>Posts</div>
            <NewsPaperIcon />
          </Link>
          <Link
            to={`/profile/${username}/friends`}
            className={`flex space-x-2 justify-center items-center px-4 basis-1/2 ${
              pathname.includes("friends") ? "fill-primary text-primary" : ""
            }`}
          >
            <div>Friends</div>
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

export const UserProfile = ({ userData }: { userData: UserData }) => {
  const { pathname } = useLocation();
  const { username } = useParams();
  const backendUrl = useServerUrl()!;
  const [areFriends, setAreFriends] = useState<boolean>(userData.areFriends);
  const allowedToViewProfile = areFriends || userData.user.public_profile;
  const [pendingRequest, setPendingRequest] = useState<boolean>(
    !!userData.friendRequestSenderId
  );

  const addFriend = () => {
    setPendingRequest(true);
    fetch("/resource/friend-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "add",
        friendId: userData.user.id,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success) {
          setPendingRequest(false);
        }
      })
      .catch(() => {
        setPendingRequest(false);
      });
  };

  const cancelFriendRequest = () => {
    setPendingRequest(false);
    fetch("/resource/friend-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "handle",
        friendId: userData.user.id,
        accepted: false,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success) {
          setPendingRequest(true);
        }
      })
      .catch(() => {
        setPendingRequest(true);
      });
  };

  const removeFriend = () => {
    setAreFriends(false);
    fetch("/resource/friend-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "remove",
        friendId: userData.user.id,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success) {
          setAreFriends(true);
        }
      })
      .catch(() => {
        setAreFriends(true);
      });
  };

  const handleFriendRequest = (id: string, accepted: boolean) => {
    if (accepted) {
      setAreFriends(true);
    }
    setPendingRequest(false);
    fetch("/resource/friend-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "handle",
        friendId: id,
        accepted: accepted,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success) {
          if (accepted) {
            setAreFriends(false);
          }
          setPendingRequest(true);
        }
      })
      .catch(() => {
        if (accepted) {
          setAreFriends(false);
        }
        setPendingRequest(true);
      });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col bg-white w-full h-fit items-center space-y-4 pt-8">
        <div className="w-4/12 flex items-center justify-between !mb-4">
          <div className="flex space-x-4 items-center">
            {userData.user.profilePictureUuid ? (
              <div className="rounded-full overflow-hidden aspect-square max-w-[120px]">
                <img
                  alt=""
                  src={`${backendUrl}/image/profile_picture/${userData.user.profilePictureUuid}`}
                  className="object-cover min-h-full"
                />
              </div>
            ) : (
              <div className="overflow-hidden max-w-[120px]">
                <img alt="" src="/images/default_profile_picture.png" />
              </div>
            )}
            <div className="text-2xl p-2">{username}</div>
          </div>
          {!areFriends ? (
            !pendingRequest ? (
              <button
                className="flex bg-primary hover:bg-primary-dark py-2 px-3 text-white rounded-lg items-center space-x-2"
                onClick={addFriend}
              >
                <div>Add friend</div>
                <UserPlusIcon className="h-6 w-6 fill-white" />
              </button>
            ) : userData.friendRequestSenderId !== userData.user.id ? (
              <button
                className="flex bg-secondary hover:bg-secondary-dark py-2 px-3 rounded-lg items-center space-x-2"
                onClick={cancelFriendRequest}
              >
                <div>Cancel request</div>
                <UserMinusIcon className="h-6 w-6" />
              </button>
            ) : (
              <div className="flex rounded-md bg-secondary py-2 px-3 items-center space-x-2">
                <div>{`Accept friend request?`}</div>
                <button
                  className="rounded-full hover:bg-stone-100"
                  onClick={() => handleFriendRequest(userData.user.id, true)}
                >
                  <CheckIcon className="h-6 w-6 fill-green-500" />
                </button>
                <button
                  className="rounded-full hover:bg-stone-100"
                  onClick={() => handleFriendRequest(userData.user.id, false)}
                >
                  <XMarkIcon className="h-6 w-6 stroke-amber-600" />
                </button>
              </div>
            )
          ) : (
            <button
              className="flex bg-red-400 hover:bg-red-500 py-2 px-3 text-white rounded-lg items-center space-x-2"
              onClick={removeFriend}
            >
              <div>Unfriend</div>
              <UserMinusIcon className="h-6 w-6 fill-white" />
            </button>
          )}
        </div>

        {allowedToViewProfile && (
          <div className="flex w-4/12 text-center border-b-2 border-primary text-2xl">
            <Link
              to={`/profile/${username}/posts`}
              className={`flex space-x-2 justify-center items-center px-4 border-r-2 border-primary basis-1/2 ${
                pathname.includes("posts") ? "fill-primary text-primary" : ""
              }`}
            >
              <div>Posts</div>
              <NewsPaperIcon />
            </Link>
            <Link
              to={`/profile/${username}/friends`}
              className={`flex space-x-2 justify-center items-center px-4 basis-1/2 ${
                pathname.includes("Friends") ? "fill-primary text-primary" : ""
              }`}
            >
              <div>Friends</div>
              <UserGroupIcon />
            </Link>
          </div>
        )}
      </div>
      {allowedToViewProfile ? (
        <div className="flex flex-col items-center justify-center space-x-4 w-6/12 py-4">
          <Outlet />
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2 w-6/12 py-4">
          <LockClosedIcon className="h-10 w-10" />
          <div className="text-xl">{"This user's profile is private!"}</div>
        </div>
      )}
    </div>
  );
};

export const UploadProfilePictureDialog = ({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const user = useUserData()!;
  const backendUrl = useServerUrl()!;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  const deletePhoto = () => {
    setError(null);
    setIsOpen(false);
    setFetching(true);
    fetch(`/resource/profile-picture`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (success) {
          window.location.reload();
        } else {
          setIsOpen(true);
          setError("Something went wrong!");
        }
      })
      .catch(() => {
        setIsOpen(true);
        setError("Something went wrong!");
      })
      .finally(() => {
        setFetching(false);
      });
  };

  const openFileSelector = () => {
    setError(null);
    inputFileRef.current?.click();
  };

  const uploadFile = (e: FormEvent<HTMLInputElement>) => {
    if (e.currentTarget.files) {
      const maxSize = 8 * 1024 * 1024;
      const file = e.currentTarget.files[0];
      if (file.size > maxSize) {
        setError("Maximum photo size is 8MB!");
        return;
      }
      setIsOpen(false);
      setFetching(true);
      const formData = new FormData();
      formData.append("photo", file);
      fetch(`/resource/profile-picture`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((success: boolean) => {
          if (success) {
            window.location.reload();
          } else {
            setIsOpen(true);
            setError("Something went wrong!");
          }
        })
        .catch(() => {
          setIsOpen(true);
          setError("Something went wrong!");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative"
        disabled={fetching}
      >
        {user.profile_picture_uuid ? (
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
        {fetching && (
          <div className="absolute top-0 left-0 bg-stone-200/[0.5] z-10 w-full h-full rounded-full flex items-center justify-center text-6xl pb-7">
            <AnimatedDots />
          </div>
        )}
      </button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center py-4 bg-black/[0.5]">
          <DialogPanel className="max-w-lg w-full border bg-white rounded-2xl">
            <DialogTitle className="relative text-lg font-bold text-center flex justify-center items-center py-4">
              Change profile photo
              {error && (
                <div className="absolute text-white bg-red-500 rounded-2xl px-4 py-2 -top-16 flex space-x-4">
                  <div className="">{error}</div>
                  <button onClick={() => setError(null)}>
                    <XMarkIcon className="stroke-white h-6 w-6" />
                  </button>
                </div>
              )}
            </DialogTitle>
            <hr />
            <button
              className="w-full py-4 font-semibold text-sky-500 hover:bg-stone-100"
              onClick={openFileSelector}
            >
              Upload photo
            </button>
            {user.profile_picture_uuid && (
              <>
                <hr />
                <button
                  className="w-full py-4 font-semibold text-red-600 hover:bg-stone-100"
                  onClick={deletePhoto}
                >
                  Remove current photo
                </button>
              </>
            )}
            <hr />
            <button
              className="w-full py-4 font-semibold hover:bg-stone-100 rounded-b-2xl"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <input
              type="file"
              accept=".jpeg,.jpg,.png"
              className="hidden"
              ref={inputFileRef}
              onChange={uploadFile}
            />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};
