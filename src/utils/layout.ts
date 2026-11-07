// Which screen layout to use. Decided from both width and height, because a
// phone held sideways is often wider than a small laptop window but much
// lower, and it is the height that runs out first.
export type Layout =
  | 'stacked' // Narrow portrait: controls under the canvas
  | 'compact' // Low landscape (phone sideways): small controls on the sides, no title
  | 'sides'; // Everything else: full controls on the sides

const NARROW_WIDTH = 768;
const LOW_HEIGHT = 500;

export const layoutFor = (width: number, height: number): Layout => {
  const landscape = width > height;
  if (!landscape && width < NARROW_WIDTH) return 'stacked';
  if (landscape && height < LOW_HEIGHT) return 'compact';
  return 'sides';
};

export const currentLayout = () => layoutFor(window.innerWidth, window.innerHeight);
