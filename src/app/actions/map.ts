"use server";

import { createClient } from "@/lib/supabase/server";
import type { BristolScale, Mood } from "@/lib/types";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  bristol_scale: BristolScale;
  mood: Mood;
  logged_at: string;
}

export interface FriendPin {
  lat: number;
  lng: number;
  friendUsername: string;
  friendAvatar: string;
}

interface MapData {
  pins: MapPin[];
  friendPins: FriendPin[];
  allowed: boolean;
}

export async function getMapData(targetUsername?: string): Promise<MapData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { pins: [], friendPins: [], allowed: false };
  }

  let targetUserId = user.id;

  // If viewing a specific user's map, verify friendship and visibility
  if (targetUsername) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, map_visibility")
      .eq("username", targetUsername)
      .single();

    if (!targetProfile) {
      return { pins: [], friendPins: [], allowed: false };
    }

    // Check if they are friends (accepted friendship)
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id, status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${targetProfile.id}),and(requester_id.eq.${targetProfile.id},addressee_id.eq.${user.id})`
      )
      .eq("status", "accepted")
      .limit(1);

    const isFriend = friendship && friendship.length > 0;

    if (!isFriend || targetProfile.map_visibility !== "friends") {
      return { pins: [], friendPins: [], allowed: false };
    }

    targetUserId = targetProfile.id;
  }

  // Query geotagged logs for the target user
  const { data: logs } = await supabase
    .from("logs")
    .select("id, lat, lng, bristol_scale, mood, logged_at")
    .eq("user_id", targetUserId)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("logged_at", { ascending: false });

  const pins: MapPin[] = (logs ?? []).map((log) => ({
    id: log.id,
    lat: log.lat!,
    lng: log.lng!,
    bristol_scale: log.bristol_scale as BristolScale,
    mood: log.mood as Mood,
    logged_at: log.logged_at,
  }));

  // If viewing own map, also get friend pins for Poop Buddies detection
  let friendPins: FriendPin[] = [];

  if (!targetUsername) {
    // Get all accepted friendships
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (friendships && friendships.length > 0) {
      // Collect friend IDs
      const friendIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      // Get profiles of friends with map_visibility = 'friends'
      const { data: friendProfiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_emoji, map_visibility")
        .in("id", friendIds)
        .eq("map_visibility", "friends");

      if (friendProfiles && friendProfiles.length > 0) {
        const visibleFriendIds = friendProfiles.map((p) => p.id);
        const friendMap = new Map(
          friendProfiles.map((p) => [
            p.id,
            { username: p.username, avatar: p.avatar_emoji },
          ])
        );

        // Get geotagged logs for all visible friends
        const { data: friendLogs } = await supabase
          .from("logs")
          .select("user_id, lat, lng")
          .in("user_id", visibleFriendIds)
          .not("lat", "is", null)
          .not("lng", "is", null)
          .order("logged_at", { ascending: false })
          .limit(500);

        friendPins = (friendLogs ?? []).map((log) => {
          const friend = friendMap.get(log.user_id)!;
          return {
            lat: log.lat!,
            lng: log.lng!,
            friendUsername: friend.username,
            friendAvatar: friend.avatar,
          };
        });
      }
    }
  }

  return { pins, friendPins, allowed: true };
}
