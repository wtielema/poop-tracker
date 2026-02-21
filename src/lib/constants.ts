import type { BristolScale, Mood } from './types';

export const BRISTOL_SCALE: Record<BristolScale, { emoji: string; label: string; description: string }> = {
  1: { emoji: '🫘', label: 'Rabbit Pellets', description: 'Hard lumps' },
  2: { emoji: '🪨', label: 'Lumpy Log', description: 'Sausage-shaped but lumpy' },
  3: { emoji: '🌽', label: 'Cracked Sausage', description: 'Like a sausage with cracks' },
  4: { emoji: '✨', label: 'The Perfect Log', description: 'Smooth and soft' },
  5: { emoji: '☁️', label: 'Soft Serve', description: 'Soft blobs with clear edges' },
  6: { emoji: '🌊', label: 'Mushy', description: 'Fluffy pieces, mushy' },
  7: { emoji: '💧', label: 'Danger Zone', description: 'Entirely liquid' },
};

export const MOODS: { emoji: Mood; label: string }[] = [
  { emoji: '😌', label: 'Relieved' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '😣', label: 'Struggled' },
  { emoji: '😱', label: 'Emergency' },
];

export const DURATION_PRESETS = [
  { label: 'Quick', description: '<2 min', seconds: 90 },
  { label: 'Normal', description: '2-5 min', seconds: 210 },
  { label: 'Marathon', description: '10+ min', seconds: 600 },
] as const;

export const STREAK_THRESHOLDS = [
  { min: 1, max: 6, fires: '🔥', label: 'Getting started' },
  { min: 7, max: 29, fires: '🔥🔥', label: 'On a roll' },
  { min: 30, max: 99, fires: '🔥🔥🔥', label: 'Unstoppable' },
  { min: 100, max: Infinity, fires: '🔥🔥🔥🔥', label: 'Legendary' },
] as const;

export const NOTE_PLACEHOLDERS = [
  'Any regrets?',
  'Rate the reading material',
  'Describe in one word',
  'How was the experience?',
  'Any dietary suspects?',
  'Would you do it again?',
  'Score out of 10?',
  'What were you thinking about?',
  'Was it worth the wait?',
  'Phone battery level?',
];
