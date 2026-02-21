import { redirect } from "next/navigation";
import { getFriendProfile } from "@/app/actions/friends";
import { getMapData } from "@/app/actions/map";
import FriendProfileClient from "./FriendProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function FriendProfilePage({ params }: Props) {
  const { username } = await params;
  const [data, mapData] = await Promise.all([
    getFriendProfile(username),
    getMapData(username),
  ]);

  if (!data) {
    redirect("/profile");
  }

  return (
    <FriendProfileClient
      data={data}
      mapPins={mapData.allowed ? mapData.pins : []}
      mapAllowed={mapData.allowed}
    />
  );
}
