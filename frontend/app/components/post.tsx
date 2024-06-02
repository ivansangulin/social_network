import { Post as PostType } from "~/service/post";
import { HeartIcon, CommentIcon } from "./icons";
import { FormEvent, useState } from "react";

export const Post = ({
  post,
  backendUrl,
}: {
  post: PostType;
  backendUrl: string | undefined;
}) => {
  const [liked, setLiked] = useState<boolean>(post.liked);
  const [likeCount, setLikeCount] = useState<number>(post._count.likes);

  const onLike = (e: FormEvent<HTMLButtonElement>) => {
    !liked
      ? e.currentTarget.classList.add("pulse-animation")
      : e.currentTarget.classList.remove("pulse-animation");
    setLikeCount((likeCount) => {
      return !liked ? ++likeCount : --likeCount;
    });
    setLiked((liked) => {
      return !liked;
    });
    fetch("/resource/like-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        liked: !liked,
        postId: post.id,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success) {
          setLiked((liked) => {
            return !liked;
          });
          setLikeCount((likeCount) => {
            return !liked ? --likeCount : ++likeCount;
          });
        }
      })
      .catch(() => {
        setLiked((liked) => {
          return !liked;
        });
        setLikeCount((likeCount) => {
          return !liked ? --likeCount : ++likeCount;
        });
      });
  };

  return (
    <div className="flex flex-col space-y-4 p-2 border border-slate-300 rounded-lg bg-white">
      <div className="flex flex-col space-y-0.5">
        <div className="flex items-center space-x-2">
          {post.user.profile_picture_uuid && backendUrl ? (
            <div className="rounded-full overflow-hidden aspect-square max-w-[50px]">
              <img
                alt=""
                src={`${backendUrl}/image/profile_picture/${post.user.profile_picture_uuid}`}
                className="object-cover min-h-full"
              />
            </div>
          ) : (
            <div className="overflow-hidden max-w-[50px]">
              <img alt="" src="/images/default_profile_picture.png" />
            </div>
          )}
          <div className="flex flex-col">
            <div className="text-xl">{post.user.username}</div>
            <div className="text-sm">{post.createdLocalDate}</div>
          </div>
        </div>
      </div>
      <div>{post.text}</div>
      <div className="flex justify-between">
        <div className="flex space-x-2 items-end">
          <HeartIcon className="w-5 h-5 fill-primary stroke-primary" />
          <span>{likeCount}</span>
        </div>
        <div className="flex space-x-2 items-end">
          <span>{post._count.comments}</span>
          <CommentIcon className="w-5 h-5 fill-primary" />
        </div>
      </div>
      <hr />
      <div className="flex justify-around">
        <button onClick={onLike}>
          <HeartIcon
            className={`w-8 h-8 stroke-primary ${liked && "fill-primary"}`}
          />
        </button>
      </div>
    </div>
  );
};
