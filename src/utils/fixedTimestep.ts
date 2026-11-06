// Physics always advances in fixed steps of 1/60 s, independent of the screen's
// frame rate. With variable steps the same shot could take a different path on
// a slow phone than on a fast PC, and an AI could not predict shots exactly.
export const PHYSICS_STEP_MS = 1000 / 60;

// After a long pause (hidden tab, very slow frame) the game slows down instead
// of trying to catch up with hundreds of steps at once.
export const MAX_STEPS_PER_FRAME = 5;

/**
 * Adds elapsed frame time to the accumulator and returns how many fixed
 * physics steps to run now, plus the leftover time for the next frame.
 */
export const consumeSteps = (accumulatorMs: number, elapsedMs: number) => {
  const total = accumulatorMs + Math.max(0, elapsedMs);
  const steps = Math.floor(total / PHYSICS_STEP_MS);
  if (steps > MAX_STEPS_PER_FRAME) {
    return { steps: MAX_STEPS_PER_FRAME, accumulatorMs: 0 };
  }
  return { steps, accumulatorMs: total - steps * PHYSICS_STEP_MS };
};
