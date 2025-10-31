import { PlanetFragment, Planet } from '../types/game';

export const createPlanetFragments = (planet: Planet): PlanetFragment[] => {
  if (!planet.sprite) return [];

  const fragments: PlanetFragment[] = [];
  const centerX = planet.x;
  const centerY = planet.y;
  const radius = planet.radius;

  // Assume sprite image is much larger (e.g., 1162x1162) and gets scaled down
  // We need to use source coordinates from the actual sprite size
  const spriteSize = 1162; // Actual sprite dimensions
  const halfSprite = spriteSize / 2;

  // Create 6-10 irregular fragments of varying sizes
  // Each fragment is a random "chunk" from different parts of the planet
  const numFragments = 6 + Math.floor(Math.random() * 5); // 6 to 10 fragments

  // Divide planet into roughly equal angular sections
  const angleStep = (Math.PI * 2) / numFragments;

  for (let i = 0; i < numFragments; i++) {
    // Base angle for this fragment
    const baseAngle = angleStep * i;
    // Add some randomness to the angle (±30 degrees)
    const angleVariation = (Math.random() - 0.5) * (Math.PI / 6);
    const fragmentAngle = baseAngle + angleVariation;

    // Random distance from center (0.2 to 0.6 of radius)
    const distanceFromCenter = radius * (0.2 + Math.random() * 0.4);
    const offsetX = Math.cos(fragmentAngle) * distanceFromCenter;
    const offsetY = Math.sin(fragmentAngle) * distanceFromCenter;

    // Vary fragment size significantly (40% to 140% of base size)
    const sizeMultiplier = 0.4 + Math.random() * 1.0;
    const fragmentWidth = radius * sizeMultiplier;
    const fragmentHeight = radius * sizeMultiplier * (0.8 + Math.random() * 0.4); // Make height slightly different

    // Pick a random chunk from the sprite that represents this area
    // Use the angle to determine which part of the sprite to use
    const spriteAngle = fragmentAngle / (Math.PI * 2); // Normalize to 0-1
    const spriteCenterX = halfSprite + Math.cos(fragmentAngle) * (halfSprite * 0.3);
    const spriteCenterY = halfSprite + Math.sin(fragmentAngle) * (halfSprite * 0.3);

    // Source size with variation for irregular edges
    const sourceWidth = halfSprite * (0.4 + Math.random() * 0.4);
    const sourceHeight = halfSprite * (0.4 + Math.random() * 0.4);

    // Position source around the calculated center point
    const sourceX = Math.max(0, Math.min(spriteSize - sourceWidth, spriteCenterX - sourceWidth / 2));
    const sourceY = Math.max(0, Math.min(spriteSize - sourceHeight, spriteCenterY - sourceHeight / 2));

    // Fragment velocity based on its angle from center
    const speed = 0.6 + Math.random() * 1.0; // Vary speed 0.6 to 1.6

    // Generate irregular polygon shape for clipping (5-8 points)
    const numPoints = 5 + Math.floor(Math.random() * 4);
    const clipPath: { x: number; y: number }[] = [];
    const maxSize = Math.max(fragmentWidth, fragmentHeight);

    for (let p = 0; p < numPoints; p++) {
      const pointAngle = (p / numPoints) * Math.PI * 2;
      // Vary the distance from center for each point (60% to 100% of max size)
      const pointDistance = maxSize * (0.6 + Math.random() * 0.4) / 2;
      clipPath.push({
        x: Math.cos(pointAngle) * pointDistance,
        y: Math.sin(pointAngle) * pointDistance
      });
    }

    fragments.push({
      x: centerX + offsetX,
      y: centerY + offsetY,
      vx: Math.cos(fragmentAngle) * speed,
      vy: Math.sin(fragmentAngle) * speed,
      rotation: Math.random() * Math.PI * 2, // Random starting rotation
      rotationSpeed: (Math.random() - 0.5) * 0.04, // Slow rotation
      width: fragmentWidth,
      height: fragmentHeight,
      sourceX: sourceX,
      sourceY: sourceY,
      sourceWidth: sourceWidth,
      sourceHeight: sourceHeight,
      sprite: planet.sprite,
      clipPath: clipPath
    });
  }

  return fragments;
};
