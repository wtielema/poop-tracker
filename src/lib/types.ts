// Enum types
export type BristolScale = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Mood = '\u{1F60C}' | '\u{1F60A}' | '\u{1F610}' | '\u{1F623}' | '\u{1F631}';
export type MapVisibility = 'friends' | 'only_me' | 'nobody';
export type FriendshipStatus = 'pending' | 'accepted';
export type ChallengeType = 'streak' | 'count';
export type FunFactCategory = 'animal' | 'history' | 'biology' | 'records' | 'statistics';

// DB row types
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  map_visibility: MapVisibility;
  created_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  bristol_scale: BristolScale;
  duration_seconds: number;
  mood: Mood;
  note: string | null;
  lat: number | null;
  lng: number | null;
  logged_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  threshold: Record<string, unknown>;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  start_date: string;
  end_date: string;
}

export interface ChallengeParticipant {
  challenge_id: string;
  user_id: string;
  progress: number;
  joined_at: string;
}

export interface FunFact {
  id: string;
  fact: string;
  category: FunFactCategory;
}
