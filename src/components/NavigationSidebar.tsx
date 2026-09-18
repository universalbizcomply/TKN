import React from 'react';
import { CategoryId } from '../types';

interface NavigationSidebarProps {
  activeCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  counts: {
    bestSeller: number;
    whatsNew: number;
    hoodies: number;
    shirts: number;
    sweatshirts: number;
  };
  onOpenSketchInfo: () => void;
  onOpenAdmin: () => void;
  onOpenTracker: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenSketchInfo,
  onOpenAdmin,
  onOpenTracker,
  wishlistCount = 0,
  onOpenWishlist,
}) => {
  return (
    <aside 
      id="navigationSidebar"
      className="fixed top-0 left-0 h-screen w-36 sm:w-44 z-40 bg-sidebar-crosshatch border-r-2 border-black flex flex-col justify-between select-none shadow-[4px_0px_10px_rgba(0,0,0,0.35)] overflow-y-auto"
    >
      {/* Top Section */}
      <div className="p-2 sm:p-2.5 space-y-2.5">
        
        {/* Header Badge: Masking Tape Label */}
        <div className="relative bg-[#feef89] border-2 border-black p-2 shadow-[2px_2px_0px_#000000] transform -rotate-1">
          {/* Jagged Tape ends */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 masking-tape serrated-tape z-10 opacity-95 pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="bg-black text-white text-[8px] font-mono-tag font-bold px-1 py-0.2 tracking-widest uppercase">
              PINNED
            </span>
          </div>

          <h2 className="font-marker text-xs sm:text-sm leading-tight text-black tracking-wide mt-0.5">
            NAVIGATION
          </h2>
          <p className="font-mono-tag text-[8px] sm:text-[9px] text-black tracking-tighter leading-tight">
            PINNED TO POSITION ➔
          </p>
          <div className="font-marker text-[10px] sm:text-xs text-neutral-800 tracking-wider">
            ARCHIVE
          </div>
        </div>

        {/* Sketched Category Buttons */}
        <nav className="space-y-1.5 pt-0.5">
          
          {/* [BEST SELLER] [HOT] (Yellow highlighter tag) */}
          <button
            id="nav-best-seller"
            onClick={() => onSelectCategory('best-seller')}
            className={`w-full text-left p-1.5 sm:p-2 border-2 border-black relative transition-all active:translate-y-0.5 ${
              activeCategory === 'best-seller'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#feef89]'
                : 'bg-[#fbf9f3] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-headline font-black text-[11px] sm:text-xs tracking-tight">
                BEST SELLER
              </span>
              <span className="bg-[#feef89] text-black border border-black text-[8px] font-mono-tag font-extrabold px-1 py-0.2 uppercase">
                HOT
              </span>
            </div>
          </button>

          {/* WHAT'S NEW (Friday Drop) */}
          <button
            id="nav-whats-new"
            onClick={() => onSelectCategory('whats-new')}
            className={`w-full text-left p-1.5 sm:p-2 border-2 border-black relative transition-all active:translate-y-0.5 ${
              activeCategory === 'whats-new'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#feef89]'
                : 'bg-[#fbf9f3] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
            }`}
          >
            <div className="flex flex-col">
              <span className="font-headline font-black text-[11px] sm:text-xs tracking-tight leading-tight">
                WHAT'S NEW
              </span>
              <span className="text-[8px] sm:text-[9px] font-typewriter italic text-neutral-400 font-bold leading-none mt-0.5">
                FRIDAY DROP
              </span>
            </div>
          </button>

          {/* HOODIES (08) */}
          <button
            id="nav-hoodies"
            onClick={() => onSelectCategory('hoodies')}
            className={`w-full text-left p-1.5 sm:p-2 border-2 border-black relative transition-all active:translate-y-0.5 ${
              activeCategory === 'hoodies'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#feef89]'
                : 'bg-[#fbf9f3] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-headline font-black text-[11px] sm:text-xs tracking-tight">
                HOODIES
              </span>
              <span className="text-[10px] font-mono-tag font-bold opacity-80">
                (08)
              </span>
            </div>
          </button>

          {/* SHIRTS (14) */}
          <button
            id="nav-shirts"
            onClick={() => onSelectCategory('shirts')}
            className={`w-full text-left p-1.5 sm:p-2 border-2 border-black relative transition-all active:translate-y-0.5 ${
              activeCategory === 'shirts'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#feef89]'
                : 'bg-[#fbf9f3] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-headline font-black text-[11px] sm:text-xs tracking-tight">
                SHIRTS
              </span>
              <span className="text-[10px] font-mono-tag font-bold opacity-80">
                (14)
              </span>
            </div>
          </button>

          {/* SWEATSHIRTS (06) */}
          <button
            id="nav-sweatshirts"
            onClick={() => onSelectCategory('sweatshirts')}
            className={`w-full text-left p-1.5 sm:p-2 border-2 border-black relative transition-all active:translate-y-0.5 ${
              activeCategory === 'sweatshirts'
                ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#feef89]'
                : 'bg-[#fbf9f3] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-headline font-black text-[11px] sm:text-xs tracking-tight">
                SWEATSHIRTS
              </span>
              <span className="text-[10px] font-mono-tag font-bold opacity-80">
                (06)
              </span>
            </div>
          </button>

          {/* View Complete Archive */}
          {activeCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="w-full text-center py-1 text-[9px] sm:text-[10px] font-mono-tag text-yellow-200/90 hover:text-white underline underline-offset-2 tracking-wider uppercase font-bold"
            >
              ← ALL ARCHIVE
            </button>
          )}
        </nav>

        {/* Pinned Masking Tape Sticky Note */}
        <div 
          onClick={onOpenSketchInfo}
          className="relative bg-[#fefce8] border-2 border-black p-2 shadow-[2px_2px_0px_#000000] transform rotate-1 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          {/* Masking Tape */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 masking-tape serrated-tape z-10 opacity-95 pointer-events-none" />
          
          <div className="flex items-center gap-1 mb-0.5 text-black">
            <span className="text-[10px]">★</span>
            <span className="font-marker text-[9px] sm:text-[10px] tracking-wider uppercase">
              SKETCH NOTE:
            </span>
          </div>

          <p className="font-architect text-[9px] sm:text-[10px] leading-tight text-neutral-800">
            Click any card to open floating photo studio & zoom angles.
          </p>
        </div>

      </div>

      {/* Bottom Controls & Stamp */}
      <div className="p-2 sm:p-2.5 pb-11 space-y-1.5">
        {onOpenWishlist && (
          <button
            id="nav-wishlist-button"
            onClick={onOpenWishlist}
            className="w-full bg-[#feef89] hover:bg-yellow-300 text-black border-2 border-black p-1 text-[9px] sm:text-[10px] font-mono-tag font-black uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 flex items-center justify-between px-2 cursor-pointer transition-colors"
            title="Open Pinned Wishlist Stash [W]"
          >
            <span className="flex items-center gap-1">
              <span>📌</span>
              <span>PINNED STASH</span>
            </span>
            <span className="bg-black text-yellow-300 text-[8px] font-mono font-bold px-1.5 py-0.2">
              {wishlistCount}
            </span>
          </button>
        )}

        <button
          onClick={onOpenTracker}
          className="w-full bg-[#fbf9f3] hover:bg-white text-black border-2 border-black p-1 text-[9px] sm:text-[10px] font-mono-tag font-bold uppercase shadow-[1px_1px_0px_#000] flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>📦</span>
          <span>TRACK ORDER</span>
        </button>

        <button
          onClick={onOpenAdmin}
          className="w-full bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black p-1 text-[9px] sm:text-[10px] font-mono-tag font-black uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 flex items-center justify-center gap-1"
        >
          <span>⚡</span>
          <span>ADMIN CONSOLE</span>
        </button>

        <div className="bg-[#111111] border-2 border-neutral-700 p-1.5 text-center shadow-[2px_2px_0px_#000000] relative">
          <div className="font-marker text-[9px] sm:text-[10px] text-[#fff500] tracking-wider leading-tight">
            TO KNOW NOTHING v2.6
          </div>
          <div className="font-mono-tag text-[7px] sm:text-[8px] text-neutral-300 tracking-widest uppercase mt-0.5 font-bold">
            100% HEAVY APPAREL
          </div>
        </div>
      </div>

    </aside>
  );
};
