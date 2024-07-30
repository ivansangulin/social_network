import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  Outlet,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useSubmit,
} from "@remix-run/react";
import { useState, useEffect, useRef, FormEvent, MouseEvent } from "react";
import { CloudUpIcon, PhotoIcon, XMarkIcon } from "~/components/icons";
import { Post } from "~/components/post";
import { SetPostsContext } from "~/root";
import { getMyFriends } from "~/service/friendship";
import {
  createNewPost,
  getMainPagePosts,
  PostPaging,
  Post as PostType,
} from "~/service/post";
import { getCookie, me } from "~/service/user";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { zfd } from "zod-form-data";
import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookie = getCookie(request);
  if (!cookie) {
    return redirect("/login");
  }
  const [user, friendsPaging, postsPaging] = await Promise.all([
    me(request, cookie),
    getMyFriends(cookie, null, null),
    getMainPagePosts(cookie, null),
  ]);
  if (!user) {
    return redirect("/login");
  }
  return json({
    user: user!,
    friendsPaging,
    postsPaging,
    backendUrl: process.env.BACKEND_URL,
  });
};

const actionSchema = zfd.formData({
  text: zfd.text(),
  photos: z.array(zfd.file()).nullish().or(zfd.file().nullish()),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = actionSchema.safeParse(formData);
  const cookie = getCookie(request);
  if (!cookie) {
    return redirect("/login");
  }
  if (data.success) {
    return await createNewPost(cookie, formData);
  } else {
    return json({ error: "Post text can't be empty!", post: null });
  }
};

export default function Index() {
  const location = useLocation();
  const isPost = location.pathname.startsWith("/post/");
  const dialog = !!location.state?.dialog;
  const postOnly = isPost && !dialog;

  useEffect(() => {
    if (dialog) {
      const beforeUnload = () => {
        history.replaceState({}, "");
      };
      window.addEventListener("beforeunload", beforeUnload);
      return () => {
        window.removeEventListener("beforeunload", beforeUnload);
      };
    }
  }, [location.pathname]);

  return (
    <div className="grow flex justify-center">
      {postOnly ? (
        <Outlet context={{ dialog: false }} />
      ) : (
        <>
          <Outlet context={{ dialog: true }} />
          <Posts />
        </>
      )}
    </div>
  );
}

const Posts = () => {
  const { postsPaging } = useLoaderData<typeof loader>();
  const cursor = useRef<string>(postsPaging?.cursor ?? "");
  const [posts, setPosts] = useState<PostType[]>(postsPaging?.posts ?? []);
  const fetcher = useFetcher();
  const fetching = useRef<boolean>(false);
  const hasMore = useRef<boolean>(
    postsPaging ? postsPaging.count > posts.length : false
  );

  useEffect(() => {
    const handleScroll = () => {
      if (
        document.documentElement.scrollHeight >
          document.documentElement.clientHeight +
            document.documentElement.scrollTop ||
        fetching.current ||
        !hasMore.current
      ) {
        return;
      }
      fetching.current = true;
      fetcher.load(`/resource/main-page-posts?cursor=${cursor.current}`);
    };
    if (window) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const data = fetcher.data as PostPaging | null;
    if (data && postsPaging) {
      cursor.current = data.cursor;
      hasMore.current = posts.length + data.posts.length < postsPaging.count;
      setPosts((posts) => {
        return [...posts, ...data.posts];
      });
    }
    fetching.current = false;
  }, [fetcher.data]);

  const onNewPost = (post: PostType) => {
    setPosts((posts) => {
      return [post, ...posts];
    });
  };

  return (
    <div className="mx-auto max-w-xl w-full">
      <div className="flex flex-col justify-center py-8 space-y-12">
        <CreatePost onNewPost={onNewPost} />
        {posts ? (
          posts.length > 0 && (
            <SetPostsContext.Provider value={setPosts}>
              <div className="flex flex-col space-y-12">
                {posts.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
            </SetPostsContext.Provider>
          )
        ) : (
          <div className="text-4xl text-center">
            Error occured fetching posts...
          </div>
        )}
      </div>
    </div>
  );
};

type FileItem = { id: string; file: File };

const CreatePost = ({ onNewPost }: { onNewPost: (post: PostType) => void }) => {
  const { user, backendUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [text, setText] = useState<string>();
  const [creating, setCreating] = useState<boolean>(false);
  const [showFileDrop, setShowFileDrop] = useState<boolean>(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>();

  const inputFileRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const maxRows = 4;
  const defaultRows = 1;
  const defaultPictureWidth = 42;
  const maxFileCount = 6;

  useEffect(() => {
    if (actionData) {
      setCreating(false);
      if (!actionData.error) {
        if (textAreaRef.current)
          textAreaRef.current.style.height = `${defaultPictureWidth}px`;
        onNewPost(actionData.post!);
        setFiles([]);
        setText("");
      } else {
        setError(actionData.error);
      }
    }
  }, [actionData]);

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setShowFileDrop(false);
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDragEnter = () => {
      if (files.length < maxFileCount) setShowFileDrop(true);
    };
    const handleDragExit = () => {
      if (files.length < maxFileCount) setShowFileDrop(false);
    };
    addEventListener("dragenter", handleDragEnter);
    addEventListener("dragexit", handleDragExit);
    addEventListener("dragover", handleDragOver);
    addEventListener("drop", handleDrop);
    return () => {
      removeEventListener("dragenter", handleDragEnter);
      removeEventListener("dragexit", handleDragExit);
      removeEventListener("dragover", handleDragOver);
      removeEventListener("drop", handleDrop);
    };
  }, [files.length]);

  const createPost = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    for (const fileItem of files) {
      formData.append("photos", fileItem.file as Blob);
    }
    submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === maxFileCount) return;
    setShowFileDrop(false);
    const uploadedFiles: FileItem[] = [];
    const maxFileSize = 8 * 1024 * 1024;
    for (const file of e.dataTransfer.files) {
      if (
        (file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/jpg") &&
        file.size <= maxFileSize
      ) {
        uploadedFiles.push({ id: uuidv4(), file });
      }
    }
    if (files.length + uploadedFiles.length > maxFileCount) {
      setFiles((f) => [
        ...f,
        ...uploadedFiles.slice(0, maxFileCount - files.length),
      ]);
    } else {
      setFiles((f) => [...f, ...uploadedFiles]);
    }
  };

  const deleteFile = (e: MouseEvent<HTMLButtonElement>, fileId: string) => {
    e.preventDefault();
    setFiles((f) => [...f.filter((f) => f.id !== fileId)]);
  };

  const openFileSelector = (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    inputFileRef.current?.click();
  };

  const uploadFiles = (e: FormEvent<HTMLInputElement>) => {
    if (files.length === maxFileCount) return;
    if (e.currentTarget.files) {
      const uploadedFiles: FileItem[] = [];
      const maxFileSize = 8 * 1024 * 1024;
      for (const file of e.currentTarget.files) {
        if (
          (file.type === "image/jpeg" ||
            file.type === "image/png" ||
            file.type === "image/jpg") &&
          file.size <= maxFileSize
        ) {
          uploadedFiles.push({ id: uuidv4(), file });
        }
      }
      if (files.length + uploadedFiles.length > maxFileCount) {
        setFiles((f) => [
          ...f,
          ...uploadedFiles.slice(0, maxFileCount - files.length),
        ]);
      } else {
        setFiles((f) => [...f, ...uploadedFiles]);
      }
    }
  };

  return (
    <Form
      className="w-full h-fit relative my-4"
      onSubmit={createPost}
      onDrop={handleDrop}
    >
      {error && (
        <div className="absolute text-white bg-red-500 rounded-2xl px-4 py-2 -top-11 flex w-full space-x-4">
          <div className="w-full">{error}</div>
          <button
            onClick={(e) => {
              e.preventDefault();
              setError(null);
            }}
          >
            <XMarkIcon className="stroke-white h-6 w-6" />
          </button>
        </div>
      )}
      {showFileDrop && (
        <div className="z-10 absolute bg-stone-100 bg-opacity-85 w-full h-full top-0 left-0 flex flex-col justify-center items-center">
          <CloudUpIcon className="h-10 w-10" />
          <div className="font-semibold">Upload photos (max 8MB)</div>
          <div className="font-semibold">
            Supported format: .jpg, .jpeg and .png
          </div>
        </div>
      )}
      <div className="border p-4 rounded-2xl space-y-4 bg-white">
        <div className="flex space-x-4 items-start">
          <div
            className="rounded-full overflow-hidden aspect-square"
            style={{ maxWidth: `${defaultPictureWidth}px` }}
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
          <textarea
            name="text"
            className="w-full outline-none resize-none scrollbar-hidden text-base border py-2 px-3 rounded-2xl transition-height"
            style={{ height: `${defaultPictureWidth}px` }}
            value={text}
            autoComplete="off"
            rows={defaultRows}
            ref={textAreaRef}
            placeholder="What's on your mind?"
            required
            onChange={(e) => {
              setText(e.currentTarget.value);
            }}
            onFocus={(e) => {
              e.currentTarget.style.height = `${
                (maxRows - 1) * defaultPictureWidth
              }px`;
            }}
            onBlur={(e) => {
              if (e.currentTarget.textLength === 0)
                e.currentTarget.style.height = `${defaultPictureWidth}px`;
            }}
          />
        </div>
        <hr />
        {files.length > 0 && (
          <>
            <div className="">Uploaded photos (max 6)</div>
            <div className="flex flex-wrap">
              {files.map(({ id, file }) => (
                <div className="basis-1/3 p-1 relative group" key={id}>
                  <button
                    onClick={(e) => deleteFile(e, id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute p-2 top-0 right-0"
                  >
                    <XMarkIcon className="h-5 w-5 stroke-white bg-stone-400 rounded-full" />
                  </button>
                  <img
                    className="w-full h-[80px] object-cover"
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                  />
                </div>
              ))}
            </div>
            <hr />
          </>
        )}
        <div className="flex justify-between items-center space-x-4">
          <input
            type="file"
            accept=".jpeg,.jpg,.png"
            multiple
            className="hidden"
            ref={inputFileRef}
            onChange={uploadFiles}
          />
          <button onClick={openFileSelector}>
            <PhotoIcon className="w-8 h-8 stroke-primary" />
          </button>
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white rounded-xl px-8 py-1 min-w-[100px]"
          >
            {creating ? <div className="animate-bounce">...</div> : "Post"}
          </button>
        </div>
      </div>
    </Form>
  );
};
