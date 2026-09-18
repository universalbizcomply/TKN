import React from 'react';
import { ProductItem } from '../types';
import { GarmentGraphic } from './GarmentGraphic';
import { CurrencyCode, formatMoney } from '../utils/currency';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stashedItems: ProductItem[];
  onRemoveFromStash: (productId: string) => void;
  onAddToCart: (product: ProductItem, size: string) => void;
  onAddAllToCart: () => void;
  onClearStash: () => void;
  onOpenStudio: (product: ProductItem) => void;
  currency: CurrencyCode;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  stashedItems,
  onRemoveFromStash,
  onAddToCart,
  onAddAllToCart,
  onClearStash,
  onOpenStudio,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="wishlistModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        className="relative z-10 w-full max-w-3xl bg-[#fbf9f3] bg-notebook-paper border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000000] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tape */}
        <div className="absolute -top-3.5 left-10 w-28 h-5 masking-tape-yellow serrated-tape pointer-events-none z-20" />

        {/* Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-mono-tag font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider shadow-xs">
              📌 PINNED STASH
            </span>
            <h2 className="font-headline font-black text-base sm:text-lg uppercase text-black">
              WISHLIST ARCHIVE ({stashedItems.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {stashedItems.length > 0 && (
              <button
                onClick={onAddAllToCart}
                className="bg-black text-yellow-300 hover:bg-neutral-800 border-2 border-black px-2.5 py-1 text-[10px] font-mono-tag font-bold uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 cursor-pointer"
                title="Add all pinned pieces to shopping bag"
              >
                + ADD ALL TO BAG
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 bg-white hover:bg-black hover:text-white border-2 border-black font-headline font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer active:translate-y-0.5"
              title="Close [Esc or W]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="my-4 overflow-y-auto flex-1 pr-1 space-y-3">
          {stashedItems.length === 0 ? (
            <div className="py-12 text-center bg-white/70 border-2 border-dashed border-black/50 p-6 my-2">
              <div className="text-4xl mb-2">📌</div>
              <p className="font-headline font-black text-base text-black uppercase">
                Your Pinned Stash is Empty
              </p>
              <p className="font-typewriter text-xs text-neutral-600 max-w-sm mx-auto mt-1">
                Pin polaroid cards to save garments for later review without committing to your bag. Favorites persist automatically between browser sessions.
              </p>
              <div className="mt-4">
                <button
                  onClick={onClose}
                  className="bg-black text-yellow-300 hover:bg-neutral-800 font-mono-tag font-bold text-xs px-4 py-1.5 border-2 border-black uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 cursor-pointer"
                >
                  ← EXPLORE THE ARCHIVE
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stashedItems.map((product) => {
                const angle = product.angles?.[0] || {
                  bgClass: 'bg-neutral-900',
                  label: 'FRONT',
                  sublabel: 'HEAVY COTTON',
                };
                const totalStock = product.stock
                  ? Object.values(product.stock).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
                  : 99;
                const isSoldOut = totalStock === 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white border-2 border-black p-2.5 flex items-center gap-3 shadow-[3px_3px_0px_#000000] relative group hover:bg-yellow-50/50 transition-colors"
                  >
                    {/* Small Polaroid Thumbnail */}
                    <div
                      onClick={() => onOpenStudio(product)}
                      className={`w-18 h-18 sm:w-20 sm:h-20 ${angle.bgClass} border border-black flex-shrink-0 flex items-center justify-center p-1 cursor-pointer relative overflow-hidden group-hover:scale-[1.02] transition-transform`}
                      title="Inspect polaroid in Photo Studio"
                    >
                      <GarmentGraphic angle={angle} />
                      <span className="absolute bottom-0.5 text-[7px] font-marker text-[#fff500] px-1 bg-black/80 uppercase tracking-tight">
                        INSPECT ⤢
                      </span>
                    </div>

                    {/* Details & Actions */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          onClick={() => onOpenStudio(product)}
                          className="font-headline font-black text-xs sm:text-[13px] text-black uppercase truncate cursor-pointer hover:underline"
                        >
                          {product.title}
                        </h4>
                        <button
                          onClick={() => onRemoveFromStash(product.id)}
                          title="Unpin from stash"
                          className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-red-600 hover:text-white border border-black text-[10px] font-bold text-neutral-600 cursor-pointer shadow-2xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-typewriter font-bold text-xs text-black">
                          {formatMoney(product.price, currency)}
                        </span>
                        <span className="font-mono-tag text-[9px] bg-neutral-100 border border-neutral-300 px-1 py-0.2 text-neutral-700">
                          {product.gsm}
                        </span>
                        {isSoldOut ? (
                          <span className="font-mono-tag text-[8px] bg-red-600 text-white px-1 py-0.2 uppercase font-bold">
                            SOLD OUT
                          </span>
                        ) : (
                          <span className="font-mono-tag text-[8px] text-emerald-700 font-bold">
                            IN STOCK
                          </span>
                        )}
                      </div>

                      {/* Add size & move to bag */}
                      <div className="mt-2">
                        <div className="text-[8px] font-mono-tag uppercase text-neutral-500 font-bold mb-0.5">
                          SELECT SIZE TO BAG:
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {product.availableSizes?.slice(0, 5).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => onAddToCart(product, sz)}
                              disabled={isSoldOut}
                              className="bg-[#fbf9f3] hover:bg-black hover:text-white disabled:opacity-40 disabled:pointer-events-none border border-black px-1.5 py-0.5 text-[9px] font-mono-tag font-bold uppercase transition-all shadow-2xs cursor-pointer active:scale-95"
                              title={`Add size ${sz} to bag`}
                            >
                              + {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {stashedItems.length > 0 && (
          <div className="pt-3 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono-tag">
            <button
              onClick={onClearStash}
              className="text-neutral-500 hover:text-red-600 underline text-[10px] uppercase font-bold cursor-pointer"
            >
              [CLEAR ENTIRE STASH]
            </button>
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 font-typewriter text-[10px]">
                💾 Saved to browser storage • Accessible between sessions
              </span>
              <kbd className="hidden sm:inline bg-neutral-200 border border-neutral-400 text-neutral-700 text-[8px] px-1 font-mono">
                W
              </kbd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

