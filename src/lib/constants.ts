import type { BristolScale, Mood } from './types';

export const BRISTOL_SCALE: Record<BristolScale, { emoji: string; label: string; description: string }> = {
  1: { emoji: '\u{1FAD8}', label: 'Rabbit Pellets', description: 'Hard lumps' },
  2: { emoji: '\u{1FAA8}', label: 'Lumpy Log', description: 'Sausage-shaped but lumpy' },
  3: { emoji: '\u{1F33D}', label: 'Cracked Sausage', description: 'Like a sausage with cracks' },
  4: { emoji: '\u2728', label: 'The Perfect Log', description: 'Smooth and soft' },
  5: { emoji: '\u2601\uFE0F', label: 'Soft Serve', description: 'Soft blobs with clear edges' },
  6: { emoji: '\u{1F30A}', label: 'Mushy', description: 'Fluffy pieces, mushy' },
  7: { emoji: '\u{1F4A7}', label: 'Danger Zone', description: 'Entirely liquid' },
};

export const MOODS: { emoji: Mood; label: string }[] = [
  { emoji: '\u{1F60C}', label: 'Relieved' },
  { emoji: '\u{1F60A}', label: 'Happy' },
  { emoji: '\u{1F610}', label: 'Meh' },
  { emoji: '\u{1F623}', label: 'Struggled' },
  { emoji: '\u{1F631}', label: 'Emergency' },
];

export const DURATION_PRESETS = [
  { label: 'Quick', description: '<2 min', seconds: 90 },
  { label: 'Normal', description: '2-5 min', seconds: 210 },
  { label: 'Marathon', description: '10+ min', seconds: 600 },
] as const;

export const STREAK_THRESHOLDS = [
  { min: 1, max: 6, fires: '\u{1F525}', label: 'Getting started' },
  { min: 7, max: 29, fires: '\u{1F525}\u{1F525}', label: 'On a roll' },
  { min: 30, max: 99, fires: '\u{1F525}\u{1F525}\u{1F525}', label: 'Unstoppable' },
  { min: 100, max: Infinity, fires: '\u{1F525}\u{1F525}\u{1F525}\u{1F525}', label: 'Legendary' },
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
