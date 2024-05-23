import { Post as PostType } from "~/service/post";
import { ThumbsUpIcon, CommentIcon } from "./icons";

export const Post = ({
  post,
  backendUrl,
}: {
  post: PostType;
  backendUrl: string | undefined;
}) => {
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
        <div className="flex space-x-2 items-center">
          <ThumbsUpIcon classname="w-5 h-5 fill-primary" />
          <span>{post._count.likes}</span>
        </div>
        <div className="flex space-x-2 items-center">
          <span>{post._count.comments}</span>
          <CommentIcon className="w-5 h-5 fill-primary" />
        </div>
      </div>
    </div>
  );
};
