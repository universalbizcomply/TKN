import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';

interface ZineFooterProps {
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onOpenModal: (type: 'about' | 'contact' | 'terms') => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onOpenShortcuts?: () => void;
  onOpenSizeGuide?: () => void;
  cartBumpTrigger?: number;
}

export const ZineFooter: React.FC<ZineFooterProps> = ({
  cartCount,
  onOpenCart,
  wishlistCount = 0,
  onOpenWishlist,
  onOpenModal,
  onOpenTracker,
  onOpenAdmin,
  onOpenShortcuts,
  onOpenSizeGuide,
  cartBumpTrigger,
}) => {
  const [isBumping, setIsBumping] = useState(false);
  const prevCountRef = useRef(cartCount);
  const prevTriggerRef = useRef(cartBumpTrigger);

  useEffect(() => {
    const isCountIncreased = cartCount > prevCountRef.current;
    const isTriggerFired = cartBumpTrigger !== undefined && cartBumpTrigger !== prevTriggerRef.current;

    if (isCountIncreased || isTriggerFired) {
      setIsBumping(false);
      const frame = requestAnimationFrame(() => {
        setIsBumping(true);
      });
      const timeout = setTimeout(() => {
        setIsBumping(false);
      }, 1000);

      prevCountRef.current = cartCount;
      prevTriggerRef.current = cartBumpTrigger;
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timeout);
      };
    }

    prevCountRef.current = cartCount;
    prevTriggerRef.current = cartBumpTrigger;
  }, [cartCount, cartBumpTrigger]);
  return (
    <footer 
      id="pinnedBottomFooter"
      className="fixed bottom-0 left-0 right-0 h-9 z-40 bg-[#fbf9f3] border-t-2 border-black flex items-center justify-between px-2 sm:px-4 select-none shadow-[0_-1px_4px_rgba(0,0,0,0.15)]"
    >
      {/* Left Links: [PINNED] ABOUT US / CONTACT / TERMS / TRACK ORDER */}
      <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[11px] font-mono-tag overflow-x-auto no-scrollbar">
        <span className="bg-black text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.2 uppercase tracking-wider">
          PINNED
        </span>

        <button
          onClick={() => onOpenModal('about')}
          className="font-headline font-bold hover:underline hover:text-red-600 transition-colors uppercase whitespace-nowrap"
        >
          ABOUT US
        </button>
        <span className="text-neutral-400">/</span>

        <button
          onClick={() => onOpenModal('contact')}
          className="font-headline font-bold hover:underline hover:text-red-600 transition-colors uppercase whitespace-nowrap"
        >
          CONTACT
        </button>
        <span className="text-neutral-400">/</span>

        <button
          onClick={() => onOpenModal('terms')}
          className="font-headline font-bold hover:underline hover:text-red-600 transition-colors uppercase whitespace-nowrap"
        >
          TERMS
        </button>
        <span className="text-neutral-400">/</span>

        {onOpenSizeGuide && (
          <>
            <button
              onClick={onOpenSizeGuide}
              className="font-headline font-bold text-neutral-900 hover:text-red-600 hover:underline uppercase whitespace-nowrap flex items-center gap-1"
              title="Open 300-500GSM Garment Size Guide [G]"
            >
              <span>📏 SIZE GUIDE</span>
              <kbd className="hidden sm:inline bg-yellow-200 text-black border border-black text-[8px] px-1 font-bold">
                G
              </kbd>
            </button>
            <span className="text-neutral-400">/</span>
          </>
        )}

        <button
          onClick={onOpenTracker}
          className="font-headline font-bold text-blue-800 hover:underline uppercase whitespace-nowrap flex items-center gap-1"
          title="Track Order [T]"
        >
          <span>📦 TRACK</span>
          <kbd className="hidden sm:inline bg-blue-100 text-blue-950 border border-blue-400 text-[8px] px-1 font-bold">
            T
          </kbd>
        </button>
      </div>

      {/* Center: London Studio & Royal Mail Dispatch */}
      <div className="hidden lg:flex items-center gap-2 font-mono-tag text-[10px] text-neutral-700 font-bold uppercase tracking-wider">
        <span>🇬🇧 LONDON STUDIO // ROYAL MAIL DISPATCH</span>
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="text-[9px] bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-1 py-0.2 border border-neutral-400 uppercase font-mono cursor-pointer"
            title="View Keyboard Shortcuts [?]"
          >
            KEYS [?]
          </button>
        )}
      </div>

      {/* Right Controls: ADMIN, STASH & BAG */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenAdmin}
          className="bg-yellow-300 hover:bg-yellow-400 text-black border border-black px-1.5 sm:px-2 py-0.5 font-mono-tag text-[9px] sm:text-[10px] font-black uppercase tracking-tight shadow-xs flex items-center gap-1 cursor-pointer"
          title="Admin Console [A]"
        >
          <span>⚡ ADMIN</span>
          <kbd className="hidden sm:inline bg-black text-yellow-300 text-[8px] px-1 font-mono">
            A
          </kbd>
        </button>

        {onOpenWishlist && (
          <button
            id="openWishlistFooterButton"
            onClick={onOpenWishlist}
            className="bg-white hover:bg-neutral-100 text-black px-1.5 sm:px-2.5 py-0.5 font-mono-tag text-[9px] sm:text-[11px] font-bold border border-black shadow-[1px_1px_0px_#000000] active:translate-y-0.5 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
            title="Pinned Wishlist Stash [W]"
          >
            <span>📌</span>
            <span className="hidden sm:inline">STASH</span>
            <span
              className={`px-1 py-0.2 text-[8px] font-black ${
                wishlistCount > 0 ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-800'
              }`}
            >
              {wishlistCount}
            </span>
            <kbd className="hidden md:inline bg-neutral-100 text-neutral-600 border border-neutral-300 text-[7px] px-1 font-mono">
              W
            </kbd>
          </button>
        )}

        <button
          id="openCartButton"
          onClick={onOpenCart}
          className={`relative px-2 sm:px-3 py-0.5 font-mono-tag text-[10px] sm:text-xs font-bold border-2 border-black active:translate-y-0.5 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
            isBumping
              ? 'animate-bag-shake bg-[#fff500] text-black shadow-[3px_3px_0px_#000000] ring-2 ring-red-600 z-10'
              : 'bg-black hover:bg-neutral-800 text-yellow-300 shadow-[1px_1px_0px_#000000]'
          }`}
          title="Shopping Bag [B]"
        >
          {/* Animated Cart Bag Icon */}
          <span 
            id="footerCartBagIcon"
            className={`inline-flex items-center justify-center transition-transform ${
              isBumping ? 'animate-icon-wiggle text-red-600' : 'text-yellow-300'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </span>

          {/* BAG Label */}
          <span className="font-headline font-black tracking-tight">BAG</span>

          {/* Pulsing / Popping Cart Count Badge */}
          <span
            id="footerCartCountBadge"
            className={`inline-flex items-center justify-center min-w-[18px] px-1.5 py-0.2 rounded-xs font-mono font-black text-[9px] sm:text-[10px] border transition-all ${
              isBumping
                ? 'animate-badge-pop bg-red-600 text-white border-black shadow-[1px_1px_0px_#000]'
                : cartCount > 0
                ? 'bg-yellow-300 text-black border-black/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            {cartCount}
          </span>

          {/* Keyboard shortcut indicator */}
          <kbd
            className={`text-[8px] font-black px-1 py-0.2 border transition-colors ${
              isBumping
                ? 'bg-black text-yellow-300 border-black'
                : 'bg-yellow-300 text-black border-yellow-400'
            }`}
          >
            B
          </kbd>

          {/* Attention-grabbing "+1 BAG" bubble sticker on successful add */}
          {isBumping && (
            <span
              id="footerCartAddedBubble"
              className="absolute -top-4 right-1 pointer-events-none bg-red-600 text-white font-mono-tag font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 border border-black shadow-[2px_2px_0px_#000] animate-bounce whitespace-nowrap"
            >
              +1 TO BAG!
            </span>
          )}
        </button>
      </div>
    </footer>
  );
};
