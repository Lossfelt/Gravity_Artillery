import { useEffect, useState } from 'react';
import { currentLayout } from '../utils/layout';

/** The current screen layout, updated on resize and rotation. */
export const useLayout = () => {
  const [layout, setLayout] = useState(currentLayout);

  useEffect(() => {
    const update = () => setLayout(currentLayout());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return layout;
};
