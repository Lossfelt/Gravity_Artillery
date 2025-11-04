import { useState, useEffect } from 'react';

export const useControlScale = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 768;
      const isLandscape = viewportWidth > viewportHeight;

      // Only scale down controls in mobile landscape mode
      if (isMobile && isLandscape) {
        // Controls are roughly 280px tall in their natural size
        const controlHeight = 280;
        const availableHeight = viewportHeight - 20; // Same as canvas maxHeight

        // Calculate scale to fit within available height
        const calculatedScale = Math.min(1, availableHeight / controlHeight);
        return Math.max(0.5, calculatedScale); // Don't scale below 50%
      }

      return 1; // No scaling needed
    };

    const updateScale = () => {
      setScale(calculateScale());
    };

    // Initial calculation
    updateScale();

    // Listen to resize and orientation changes
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  return scale;
};
