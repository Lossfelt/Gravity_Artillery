import { ReactNode } from 'react';

// Small line icons drawn with SVG, so they look the same on every platform
// (emoji differ a lot between phones). They follow the text colour and size.
const Icon = ({ children, className = 'w-[1.1em] h-[1.1em]' }: { children: ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const ChevronUp = () => <Icon><path d="M6 15l6-6 6 6" /></Icon>;
export const ChevronDown = () => <Icon><path d="M6 9l6 6 6-6" /></Icon>;
export const ChevronsUp = () => <Icon><path d="M6 13l6-6 6 6M6 19l6-6 6 6" /></Icon>;
export const ChevronsDown = () => <Icon><path d="M6 5l6 6 6-6M6 11l6 6 6-6" /></Icon>;

export const Crosshair = () => (
  <Icon>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
  </Icon>
);

export const Check = () => <Icon><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;

export const NextArrow = () => <Icon><path d="M5 12h13M13 6l6 6-6 6" /></Icon>;
