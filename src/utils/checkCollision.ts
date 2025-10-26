export const checkCollision = (
  proj: { x: number; y: number },
  target: { x: number; y: number },
  radius: number
) => {
  const dx = proj.x - target.x;
  const dy = proj.y - target.y;
  return Math.sqrt(dx * dx + dy * dy) < radius;
};
