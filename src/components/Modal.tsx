import { ReactNode } from 'react';
import { Heart } from './icons';

type ModalProps = {
  title: string;
  children: ReactNode;
  compact?: boolean;
};

/** A panel over the whole screen. Scrolls if the screen is too low for it. */
export const Modal = ({ title, children, compact = false }: ModalProps) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label={title}
    className={`fixed inset-0 z-10 flex overflow-y-auto bg-black/70 backdrop-blur-[2px] ${compact ? 'p-2' : 'p-4'}`}
  >
    {/* m-auto centres the panel, but lets it scroll from the top when it is taller than the screen */}
    <div className={`panel m-auto w-full max-w-lg text-center ${compact ? 'p-3' : 'p-5 md:p-7'}`}>
      <h2
        className={`font-bold uppercase tracking-[0.08em] ${compact ? 'text-lg mb-2' : 'text-2xl md:text-3xl mb-4'}`}
        style={{ textShadow: '0 0 20px var(--accent)' }}
      >
        {title}
      </h2>
      {children}
    </div>
  </div>
);

/** Lives as a row of hearts, with a label for screen readers. */
export const LivesRow = ({ lives }: { lives: number }) => (
  <span className="inline-flex gap-0.5 align-[-0.1em] text-[#ff5c7a]" role="img" aria-label={`${lives} ${lives === 1 ? 'life' : 'lives'}`}>
    {Array.from({ length: lives }, (_, i) => <Heart key={i} />)}
  </span>
);
