import React from "react";

function ProfilePage({ params }: { params: { username: string } }) {
  console.log(params);
  throw new Error("Error");
  return <div>ProfilePage</div>;
}

export default ProfilePage;
