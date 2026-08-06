export const RESEARCH_SECONDS = 15 * 60;
export const RECALL_SECONDS = 60;
export const NO_REPEAT_DAYS = 180;
export const REVISIT_DAYS = 30;
export const ROTATION_WINDOW_DAYS = 7;
export const ROTATION_MAX_IN_WINDOW = 2;
export const DEPTH_REVISIT_THRESHOLD = 2;

// Difficulty draw weighting: 1 -> 20%, 2 -> 60%, 3 -> 20%
export const DIFFICULTY_WEIGHTS: Record<1 | 2 | 3, number> = {
  1: 0.2,
  2: 0.6,
  3: 0.2,
};
