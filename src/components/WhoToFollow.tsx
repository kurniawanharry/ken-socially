import { getRandomUsers } from "@/actions/user.action";
import React, { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import FollowButton from "./FollowButton";
import { Avatar, AvatarImage } from "./ui/avatar";

async function WhoToFollow() {
  const users = await getRandomUsers();
  if (users?.length == 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who To Follow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image ?? "/avatar.png"} />
                  </Avatar>
                </Link>
                <div className="text-sm leading-tight">
                  <Link
                    href={`/profile/${user.username}`}
                    className="font-semibold hover:underline"
                  >
                    {user.name}
                  </Link>
                  <div className="text-muted-foreground text-xs">
                    @{user.username}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {user._count.followers} followers
                  </div>
                </div>
              </div>
              <FollowButton userId={user.id} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default WhoToFollow;
