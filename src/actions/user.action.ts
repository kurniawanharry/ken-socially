"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        image: user.imageUrl,
      },
    });
    return dbUser;
  } catch (error) {
    console.log("Error from asyncUser", error);
  }
}

export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          post: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    //Get 3 random users, exclude ourselves and users that we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: {
          NOT: { id: userId },
        },
        NOT: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });
    return randomUsers;
  } catch (error) {
    console.error("Error getRandomUsers", error);
    return [];
  }
}

export async function toggleFollow(targerId: string) {
  const userId = await getDbUserId();

  if (!userId) return;

  if (userId == targerId) throw new Error("You cannot follow yourself!");

  try {
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targerId,
        },
      },
    });

    if (existingFollow) {
      //unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targerId,
          },
        },
      });
    } else {
      //follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targerId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targerId,
            creatorId: userId,
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}
