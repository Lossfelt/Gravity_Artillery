import { useState, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(() =>
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};
