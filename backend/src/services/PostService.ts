import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POST_PAGING_TAKE = 5;

export const getUserPosts = async (
  userId: number,
  cursor: number | undefined
) => {
  const [count, posts] = await prisma.$transaction([
    prisma.post.count({ where: { user_id: userId } }),
    prisma.post.findMany({
      take: POST_PAGING_TAKE,
      skip: !!cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        created: true,
        text: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      where: {
        user_id: userId,
      },
    }),
  ]);

  const userPostPaging = {
    count,
    posts,
    cursor: posts.length > 0 ? posts[posts.length - 1].id : 0,
  };

  return userPostPaging;
};
