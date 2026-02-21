import { redirect } from "next/navigation";
import { getFriendProfile } from "@/app/actions/friends";
import FriendProfileClient from "./FriendProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function FriendProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getFriendProfile(username);

  if (!data) {
    redirect("/profile");
  }

  return <FriendProfileClient data={data} />;
}
