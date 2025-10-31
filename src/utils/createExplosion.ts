import { ExplosionParticle } from '../types/game';

export const createExplosion = (x: number, y: number, numParticles = 30): ExplosionParticle[] => {
  const particles: ExplosionParticle[] = [];
  const colors = ['#ff4500', '#ff6347', '#ffa500', '#ffff00', '#ff8c00'];

  for (let i = 0; i < numParticles; i++) {
    const angle = (Math.PI * 2 * i) / numParticles + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    const life = 60 + Math.random() * 40; // 60-100 frames

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 3
    });
  }

  return particles;
};
