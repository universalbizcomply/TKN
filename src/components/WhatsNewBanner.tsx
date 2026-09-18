import React, { useState } from 'react';
import { DropBannerConfig } from '../types';

interface WhatsNewBannerProps {
  onExploreDrop: () => void;
  bannerConfig?: DropBannerConfig | null;
}

export const WhatsNewBanner: React.FC<WhatsNewBannerProps> = ({ onExploreDrop, bannerConfig }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const tag = bannerConfig?.tag || "[WHAT'S NEW DROP - NEW ARRIVALS]";
  const message = bannerConfig?.message || 'Fresh oversized heavy tees, workwear pants & acid wash zip-ups uploaded every Friday @ midnight.';
  const ctaText = bannerConfig?.ctaText || '[EXPLORE DROP →]';

  return (
    <div 
      id="whatsNewDropBanner"
      className="fixed bottom-9 left-36 sm:left-44 right-0 z-30 bg-[#fefce8] border-t-2 border-b-2 border-black px-2.5 sm:px-4 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] transition-all"
    >
      {/* Masking tape decorative tabs */}
      <div className="absolute -top-2 left-10 w-16 h-3 masking-tape serrated-tape opacity-90 pointer-events-none hidden sm:block" />
      <div className="absolute -top-2 right-16 w-16 h-3 masking-tape-pink serrated-tape opacity-90 pointer-events-none hidden sm:block" />

      {isMinimized ? (
        <div className="flex items-center justify-between text-xs py-0.5">
          <div className="flex items-center gap-2">
            <span className="bg-[#fbcfe8] text-black border border-black text-[9px] font-marker px-1.5 py-0.2 uppercase">
              {tag}
            </span>
            <span className="font-typewriter text-[11px] text-neutral-800">
              Friday @ midnight
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExploreDrop}
              className="bg-black text-yellow-300 font-headline font-bold text-[10px] sm:text-xs px-2.5 py-0.5 border border-black shadow-xs uppercase tracking-wider"
            >
              {ctaText}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="font-mono-tag text-[10px] text-neutral-700 hover:text-black font-bold px-1"
              title="Expand banner"
            >
              [▲]
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Tag + Text */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Masking tape banner with pink tag */}
            <div className="bg-[#fbcfe8] border border-black text-black text-[9px] sm:text-[10px] font-marker px-1.5 sm:px-2 py-0.5 shadow-xs uppercase tracking-wider transform -rotate-1 whitespace-nowrap">
              {tag}
            </div>

            <p className="font-typewriter text-[10px] sm:text-[11px] text-neutral-800 truncate max-w-xl">
              {message}
            </p>
          </div>

          {/* Right: CTA & Minimize */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            <button
              onClick={onExploreDrop}
              className="bg-black hover:bg-neutral-800 text-[#fff500] font-headline font-black text-[10px] sm:text-xs tracking-wider px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 transition-all whitespace-nowrap"
            >
              {ctaText}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="font-mono-tag text-[9px] text-neutral-500 hover:text-black px-1"
              title="Minimize banner"
            >
              [▼]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
