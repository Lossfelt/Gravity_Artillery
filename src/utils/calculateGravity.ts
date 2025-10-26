import { GravityBody } from '../types/game';

export const calculateGravity = (px: number, py: number, bodies: GravityBody[]) => {
  let ax = 0;
  let ay = 0;

  bodies.forEach(body => {
    const dx = body.x - px;
    const dy = body.y - py;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist > 1) {
      const force = body.mass / distSq;
      ax += force * (dx / dist);
      ay += force * (dy / dist);
    }
  });

  return { ax, ay };
};
