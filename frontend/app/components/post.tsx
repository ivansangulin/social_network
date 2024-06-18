import { CommentType, Post as PostType, Reply } from "~/service/post";
import {
  HeartIcon,
  CommentIcon,
  ChatBubbleBottomCenterText,
  PaperAirplaneIcon,
  XMarkIcon,
  ShareIcon,
} from "./icons";
import React, {
  FormEvent,
  useRef,
  useState,
  KeyboardEvent,
  useContext,
  useEffect,
} from "react";
import { useServerUrl } from "~/hooks/useServerUrl";
import { useUserData } from "~/hooks/useUserData";
import { Link, useFetcher, useLocation, useNavigate } from "@remix-run/react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AnimatedDots } from "./animated-dots";
import { SetPostsContext } from "~/root";
import { CommentsPaging, RepliesPaging } from "~/service/comment";

export const Post = ({ post }: { post: PostType }) => {
  const [liked, setLiked] = useState<boolean>(post.liked);
  const [likeCount, setLikeCount] = useState<number>(post._count.likes);
  const [comments, setComments] = useState<CommentType[]>(post.comments ?? []);
  const [commentCount, setCommentCount] = useState<number>(
    post._count.comments
  );
  const backendUrl = useServerUrl();
  const user = useUserData()!;
  const location = useLocation();
  const navigate = useNavigate();

  const defaultRows = 1;
  const defaultPictureHeight = 42;
  const maxHeight = 42 * 5;

  const [text, setText] = useState<string>("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const commentingDisabled = text.trim() === "";

  const [reply, setReply] = useState<CommentType | null | undefined>();

  const fetcher = useFetcher();
  const cursor = useRef<string>(
    comments.length > 0 ? comments[comments.length - 1].id : ""
  );
  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(
    post.parentCommentCount ? comments.length < post.parentCommentCount : false
  );
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const singleComment = useRef<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (commentsContainerRef.current) {
        if (
          commentsContainerRef.current.scrollHeight >
            commentsContainerRef.current.offsetHeight +
              commentsContainerRef.current.scrollTop ||
          fetching.current ||
          !hasMore.current
        ) {
          return;
        }
        fetching.current = true;
        fetcher.load(
          `/resource/comments?entities=comments&parentEntityId=${post.id}&cursor=${cursor.current}`
        );
      }
    };
    const commentsContainerCurrent = commentsContainerRef.current;
    if (commentsContainerCurrent) {
      commentsContainerCurrent.addEventListener("scroll", handleScroll);
      return () => {
        commentsContainerCurrent.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const data = fetcher.data as CommentsPaging | null;
    if (data && post.parentCommentCount) {
      singleComment.current = false;
      cursor.current = data.cursor;
      hasMore.current =
        comments.length + data.comments.length < post.parentCommentCount;
      setComments((prevComments) => {
        return [...prevComments, ...data.comments];
      });
    }
    fetching.current = false;
  }, [fetcher.data]);

  const canUseDOM = !!(
    typeof window !== "undefined" &&
    window.document &&
    window.document.createElement
  );

  const useLayoutEffect = canUseDOM ? React.useLayoutEffect : () => {};

  useLayoutEffect(() => {
    if (commentsContainerRef.current && singleComment.current) {
      commentsContainerRef.current.scrollTop =
        commentsContainerRef.current.scrollHeight;
    }
  }, [comments]);

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
      singleComment.current = true;
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
            const comment = { ...newComment, id: id };
            setComments((prevComments) => {
              return [...prevComments.filter((c) => c.id !== tempId), comment];
            });
          } else {
            const newReply = { ...newComment };
            newReply.id = id;
            const newReplies = [
              ...parentComment.replies!.filter((r) => r.id !== tempId),
            ];
            newReplies.push(newReply);
            setComments((prevComments) => {
              return [
                ...prevComments.slice(0, parentIndex),
                { ...parentComment, replies: newReplies },
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
            <div className="flex space-x-2 items-baseline">
              <Link
                className="text-lg font-semibold hover:underline"
                to={`/profile/${post.user.username}/posts`}
              >
                {post.user.username}
              </Link>
              {!!post.parent && (
                <span className="text-sm text-neutral-600">shared a post</span>
              )}
            </div>
            <div className="text-sm">{post.createdLocalDate}</div>
          </div>
        </div>
      </div>
      <div>{post.text}</div>
      {post.parent && (
        <div className="flex flex-col space-y-4 p-4 border border-slate-300 rounded-lg">
          <div className="flex flex-col space-y-0.5">
            <div className="flex items-center space-x-2">
              {post.parent.user.profile_picture_uuid && backendUrl ? (
                <div className="rounded-full overflow-hidden aspect-square max-w-[50px]">
                  <img
                    alt=""
                    src={`${backendUrl}/image/profile_picture/${post.parent.user.profile_picture_uuid}`}
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
                  className="text-lg font-semibold hover:underline"
                  to={`/profile/${post.parent.user.username}/posts`}
                >
                  {post.parent.user.username}
                </Link>
                <div className="text-sm">{post.parent.createdLocalDate}</div>
              </div>
            </div>
          </div>
          <div>{post.parent.text}</div>
        </div>
      )}
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
            className={`w-8 h-8 stroke-primary hover:scale-110 transition duration-100 ${
              liked && "fill-primary"
            }`}
          />
        </button>
        <button
          onClick={
            location.pathname.includes("/post/")
              ? () => textAreaRef.current?.focus()
              : () => navigate(`/post/${post.id}`)
          }
        >
          <ChatBubbleBottomCenterText className="w-8 h-8 stroke-primary hover:scale-110 transition duration-100" />
        </button>
        {!post.parent && <ShareDialog postId={post.id} />}
      </div>
      <hr />
      <div className="flex flex-col space-y-4">
        <div
          className="flex flex-col space-y-4 max-h-[48rem] overflow-y-auto no-scrollbar"
          ref={commentsContainerRef}
        >
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
        </div>
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
  const [replies, setReplies] = useState<Reply[]>(comment.replies ?? []);
  const defaultPictureHeight = 42;

  const fetcher = useFetcher();
  const cursor = useRef<string>(
    replies.length > 0 ? replies[replies.length - 1].id : "string"
  );
  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(
    comment._count.replies ? comment._count.replies > replies.length : false
  );

  useEffect(() => {
    if (comment.replies) setReplies(comment.replies);
  }, [comment.replies]);

  useEffect(() => {
    const data = fetcher.data as RepliesPaging | null;
    if (data && comment._count.replies) {
      cursor.current = data.cursor;
      hasMore.current =
        replies.length + data.replies.length < comment._count.replies;
      setReplies((prevReplies) => {
        return [...prevReplies, ...data.replies];
      });
    }
    fetching.current = false;
  }, [fetcher.data]);

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

  const fetchReplies = () => {
    if (!fetching.current) {
      fetching.current = true;
      fetcher.load(
        `/resource/comments?entities=replies&parentEntityId=${comment.id}&cursor=${cursor.current}`
      );
    }
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
            to={`/profile/${comment.user.username}/posts`}
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
        {replies.map((reply) => (
          <div className="py-1" key={reply.id}>
            <Comment comment={reply} onReply={onReply} key={reply.id} />
          </div>
        ))}
        {hasMore.current && (
          <button
            className="text-sky-600 hover:underline self-start"
            onClick={fetchReplies}
          >
            View more
          </button>
        )}
      </div>
    </div>
  );
};

const ShareDialog = ({ postId }: { postId: string }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [sharing, setSharing] = useState<boolean>(false);
  const setPosts = useContext(SetPostsContext);
  const defaultRows = 4;

  const share = () => {
    setSharing(true);
    const description = text;
    setText("");
    fetch(`/resource/share-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId: postId,
        text: description,
      }),
    })
      .then((res) => res.json())
      .then((sharedPost: PostType | null) => {
        if (!sharedPost) {
          setText(description);
        } else {
          if (setPosts)
            setPosts((prevPosts) => {
              return [sharedPost, ...prevPosts];
            });
          setIsOpen(false);
        }
      })
      .catch(() => {
        setText(description);
      })
      .finally(() => {
        setSharing(false);
      });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <ShareIcon className="w-8 h-8 stroke-primary hover:scale-110 transition duration-100" />
      </button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/[0.5]">
          <DialogPanel className="max-w-lg w-2/4 space-y-4 border bg-white p-4 rounded-2xl">
            <DialogTitle className="font-bold text-center flex justify-between items-center">
              <div className="p-1" />
              <div className="text-lg">Share</div>
              <button
                className="p-1 rounded-full hover:bg-stone-100"
                onClick={() => setIsOpen(false)}
                disabled={sharing}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </DialogTitle>
            <textarea
              rows={defaultRows}
              placeholder="Add a description"
              className="w-full outline-none resize-none scrollbar-hidden text-base rounded-2xl border py-2 px-4"
              onChange={(e) => setText(e.currentTarget.value)}
              value={text}
              autoComplete="off"
            />
            <div className="flex">
              <button
                className={`w-full bg-primary text-white py-1 px-3 rounded-xl ${
                  !sharing ? "hover:bg-primary-dark" : "cursor-not-allowed"
                }`}
                onClick={share}
                disabled={sharing}
              >
                {!sharing ? (
                  "Share"
                ) : (
                  <div className="flex justify-center tracking-widest h-fit">
                    <AnimatedDots />
                  </div>
                )}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};
