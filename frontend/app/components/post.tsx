import { CommentType, Post as PostType } from "~/service/post";
import {
  HeartIcon,
  CommentIcon,
  ChatBubbleBottomCenterText,
  PaperAirplaneIcon,
  XMarkIcon,
} from "./icons";
import { FormEvent, useRef, useState, KeyboardEvent } from "react";
import { useServerUrl } from "~/hooks/useServerUrl";
import { useUserData } from "~/hooks/useUserData";
import { Link } from "@remix-run/react";

export const Post = ({ post }: { post: PostType }) => {
  const [liked, setLiked] = useState<boolean>(post.liked);
  const [likeCount, setLikeCount] = useState<number>(post._count.likes);
  const [comments, setComments] = useState<CommentType[]>(post.comments);
  const [commentCount, setCommentCount] = useState<number>(
    post._count.comments
  );
  const backendUrl = useServerUrl();
  const user = useUserData()!;

  const defaultRows = 1;
  const defaultPictureHeight = 42;
  const maxHeight = 42 * 5;

  const [text, setText] = useState<string>("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const commentingDisabled = text.trim() === "";

  const [reply, setReply] = useState<CommentType | null | undefined>();

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

  const handleTextChange = (e: FormEvent<HTMLTextAreaElement>) => {
    setText(e.currentTarget.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = `auto`;
      textAreaRef.current.style.height = `${Math.min(
        textAreaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      comment();
    }
  };

  const comment = () => {
    const comment = text;
    const tempId = new Date().toISOString();
    const parentComment = reply?.parent_id
      ? comments.find((c) => c.id === reply.parent_id)
      : reply;
    const parentIndex = comments.findIndex((c) => c.id === parentComment?.id);
    setText("");
    setCommentCount((c) => {
      return c + 1;
    });
    setReply(null);
    const newComment = {
      id: tempId,
      text: comment,
      createdDescriptive: "Just now",
      user: user,
      _count: {
        likes: 0,
      },
      liked: false,
      parent_id: parentComment?.id,
    };
    if (!parentComment) {
      setComments((prevComments) => {
        return [...prevComments, newComment];
      });
    } else {
      if (parentComment.replies) {
        parentComment.replies.push(newComment);
      } else {
        parentComment.replies = [newComment];
      }
      setComments((prevComments) => {
        return [
          ...prevComments.slice(0, parentIndex),
          parentComment,
          ...prevComments.slice(parentIndex + 1),
        ];
      });
    }
    fetch("/resource/comment-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: comment,
        postId: post.id,
        commentId: reply ? reply.id : undefined,
      }),
    })
      .then((res) => res.json())
      .then((id: string | null) => {
        if (!id) {
          if (!parentComment) {
            setComments((prevComments) => {
              return [...prevComments.filter((c) => c.id !== tempId)];
            });
          } else {
            parentComment.replies = parentComment.replies!.filter(
              (r) => r.id !== tempId
            );
            setComments((prevComments) => {
              return [
                ...prevComments.slice(0, parentIndex),
                parentComment,
                ...prevComments.slice(parentIndex + 1),
              ];
            });
          }
          setReply(parentComment);
          setText(comment);
          setCommentCount((c) => {
            return c - 1;
          });
        } else {
          if (!parentComment) {
            const comment = { ...newComment };
            comment.id = id;
            setComments((prevComments) => {
              return [...prevComments.filter((c) => c.id !== tempId), comment];
            });
          } else {
            const newReply = { ...newComment };
            newReply.id = id;
            parentComment.replies = parentComment.replies!.filter(
              (r) => r.id !== tempId
            );
            parentComment.replies.push(newReply);
            setComments((prevComments) => {
              return [
                ...prevComments.slice(0, parentIndex),
                parentComment,
                ...prevComments.slice(parentIndex + 1),
              ];
            });
          }
        }
      })
      .catch(() => {
        if (!parentComment) {
          setComments((prevComments) => {
            return [...prevComments.filter((c) => c.id !== tempId)];
          });
        } else {
          parentComment.replies = parentComment.replies!.filter(
            (r) => r.id !== tempId
          );
          setComments((prevComments) => {
            return [
              ...prevComments.slice(0, parentIndex),
              parentComment,
              ...prevComments.slice(parentIndex + 1),
            ];
          });
        }
        setReply(parentComment);
        setText(comment);
        setCommentCount((c) => {
          return c - 1;
        });
      });
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border border-slate-300 rounded-lg bg-white">
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
            <Link
              className="text-xl font-semibold hover:underline"
              to={`/profile/${post.user.username}`}
            >
              {post.user.username}
            </Link>
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
          <span>{commentCount}</span>
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
        <button onClick={() => textAreaRef.current?.focus()}>
          <ChatBubbleBottomCenterText className="w-8 h-8 stroke-primary hover:fill-primary hover:stroke-white" />
        </button>
      </div>
      <hr />
      <div className="flex flex-col space-y-4">
        {comments.map((comment) => (
          <Comment
            comment={comment}
            key={comment.id}
            onReply={(comment: CommentType) => {
              setReply(comment);
              textAreaRef.current?.focus();
            }}
          />
        ))}
        <div className="flex-col">
          {reply && (
            <div className="flex items-center space-x-4 ml-20 bg-secondary w-fit py-1 px-2 text-sm rounded-t-lg">
              <div className="rounded-full overflow-hidden aspect-square max-w-6 bg-white">
                {reply.user.profile_picture_uuid ? (
                  <img
                    alt=""
                    src={`${backendUrl}/image/profile_picture/${reply.user.profile_picture_uuid}`}
                    className="object-cover min-h-full"
                  />
                ) : (
                  <img alt="" src="/images/default_profile_picture.png" />
                )}
              </div>
              <div className="self-start">{`Replying to ${reply.user.username}`}</div>
              <button className="" onClick={() => setReply(null)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="flex space-x-4 items-start">
            <div
              className="rounded-full overflow-hidden aspect-square"
              style={{ maxWidth: `${defaultPictureHeight}px` }}
            >
              {user.profile_picture_uuid ? (
                <img
                  alt=""
                  src={`${backendUrl}/image/profile_picture/${user.profile_picture_uuid}`}
                  className="object-cover min-h-full"
                />
              ) : (
                <img alt="" src="/images/default_profile_picture.png" />
              )}
            </div>
            <div className="border rounded-2xl py-2 px-3 w-full flex space-x-4 bg-secondary">
              <textarea
                ref={textAreaRef}
                rows={defaultRows}
                placeholder={
                  commentCount === 0 ? "Be first to comment" : "Add comment"
                }
                className={`w-full outline-none resize-none scrollbar-hidden text-base bg-secondary h-[${defaultPictureHeight}px]`}
                onChange={handleTextChange}
                onKeyDown={onKeyDown}
                value={text}
                autoComplete="off"
              />
              <button
                className={`self-end ${
                  commentingDisabled && "cursor-not-allowed"
                }`}
                onClick={comment}
                disabled={commentingDisabled}
              >
                <PaperAirplaneIcon
                  className={`w-6 h-6 stroke-primary ${
                    !commentingDisabled &&
                    "hover:stroke-black hover:fill-primary"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Comment = ({
  comment,
  onReply,
}: {
  comment: CommentType;
  onReply: (comment: CommentType) => void;
}) => {
  const backendUrl = useServerUrl();
  const [liked, setLiked] = useState<boolean>(comment.liked);
  const [likeCount, setLikeCount] = useState<number>(comment._count.likes);
  const defaultPictureHeight = 42;

  const likeComment = () => {
    setLiked((l) => {
      return !l;
    });
    setLikeCount((lc) => {
      return !liked ? ++lc : --lc;
    });
    fetch(`/resource/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commentId: comment.id,
        liked: !liked,
      }),
    })
      .then((res) => res.json())
      .then((success: boolean) => {
        if (!success) {
          setLiked((l) => {
            return !l;
          });
          setLikeCount((lc) => {
            return !liked ? --lc : ++lc;
          });
        }
      })
      .catch(() => {
        setLiked((l) => {
          return !l;
        });
        setLikeCount((lc) => {
          return !liked ? --lc : ++lc;
        });
      });
  };

  return (
    <div className="flex space-x-4 items-start">
      <div
        className="rounded-full overflow-hidden aspect-square"
        style={{ maxWidth: `${defaultPictureHeight}px` }}
      >
        {comment.user.profile_picture_uuid ? (
          <img
            alt=""
            src={`${backendUrl}/image/profile_picture/${comment.user.profile_picture_uuid}`}
            className="object-cover min-h-full"
          />
        ) : (
          <img alt="" src="/images/default_profile_picture.png" />
        )}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="border rounded-2xl py-1 px-3 flex flex-col space-x-4 bg-secondary w-fit">
          <Link
            className="font-semibold hover:underline"
            to={`/profile/${comment.user.username}`}
          >
            {comment.user.username}
          </Link>
          {comment.text}
        </div>
        <div className="flex space-x-2 px-2 text-sm">
          <div>{comment.createdDescriptive}</div>
          <button className="hover:underline" onClick={likeComment}>
            {!liked ? "Like" : "Dislike"}
          </button>
          <button
            className="hover:underline"
            disabled={comment.id.includes("-")}
            onClick={() => onReply(comment)}
          >
            Reply
          </button>
          <div className="flex space-x-1">
            <HeartIcon className="w-5 h-5 fill-primary stroke-primary" />
            <span>{likeCount}</span>
          </div>
        </div>
        {comment.replies &&
          comment.replies.map((reply) => (
            <div className="py-1" key={reply.id}>
              <Comment comment={reply} onReply={onReply} key={reply.id} />
            </div>
          ))}
      </div>
    </div>
  );
};
