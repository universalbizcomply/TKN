import React, { useState } from 'react';
import { ProductItem } from '../types';
import { GarmentGraphic } from './GarmentGraphic';
import { CurrencyCode, formatMoney } from '../utils/currency';
import { playCameraShutter, playStampSound } from '../utils/audio';

interface PolaroidCardProps {
  product: ProductItem;
  index: number;
  currency?: CurrencyCode;
  isStashed?: boolean;
  onToggleStash?: (product: ProductItem) => void;
  onOpenStudio: (product: ProductItem, initialSlide?: number) => void;
  onQuickAdd: (product: ProductItem) => void;
  onNotifyMe?: (product: ProductItem) => void;
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({
  product,
  index,
  currency = 'USD',
  isStashed = false,
  onToggleStash,
  onOpenStudio,
  onQuickAdd,
  onNotifyMe,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  // Subtle organic rotation (-1.5deg to +1.5deg)
  const rotations = ['-rotate-[1.4deg]', 'rotate-[1.1deg]', '-rotate-[0.8deg]', 'rotate-[1.3deg]', '-rotate-[1.2deg]', 'rotate-[0.9deg]'];
  const baseRotation = rotations[index % rotations.length];

  // Randomized jitter animation on hover mimicking unstable, hand-drawn paper elements
  const jitterClass = `polaroid-jitter-${index % 6}`;

  const currentAngle = product.angles[activeSlide] || product.angles[0];

  const handleNextAngle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % product.angles.length);
  };

  const handleCardClick = () => {
    playCameraShutter();
    onOpenStudio(product, activeSlide);
  };

  const handleStashClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playStampSound();
    if (onToggleStash) onToggleStash(product);
  };

  const totalStock = product.stock
    ? Object.values(product.stock).reduce((a, b) => a + b, 0)
    : 10;
  const isSoldOut = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 6;

  return (
    <div
      className={`relative group cursor-pointer select-none transition-shadow duration-200 ${baseRotation} ${jitterClass} hover:z-30 w-full max-w-[195px] mx-auto`}
      onClick={handleCardClick}
    >
      {/* Stacked Photo Under-layers (Physical Deck Effect) */}
      <div className="absolute inset-0 bg-white border-2 border-black translate-x-1 translate-y-1.5 rotate-1.5 -z-10 shadow-xs pointer-events-none transition-transform duration-200 group-hover:translate-x-1.5 group-hover:translate-y-2 group-hover:rotate-2" />
      <div className="absolute inset-0 bg-[#f7f5ed] border-2 border-black -translate-x-0.5 translate-y-0.5 -rotate-1 -z-20 pointer-events-none transition-transform duration-200 group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:-rotate-1.5" />

      {/* Main Polaroid Shell */}
      <div className="bg-white border-2 border-black p-2 pb-3.5 polaroid-drop-shadow relative transition-shadow duration-200 group-hover:polaroid-drop-shadow-lg">
        
        {/* Serrated Masking Tape at Top Center */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 masking-tape serrated-tape z-30 opacity-95 pointer-events-none shadow-xs">
          <div className="w-full h-full border-t border-b border-black/10" />
        </div>

        {/* 1:1 Square Photo Canvas Window */}
        <div className={`relative w-full aspect-square ${currentAngle.bgClass} border border-black overflow-hidden flex flex-col justify-between p-1.5`}>
          
          {/* Top Bar: Pushpin Stash (left) & Slide Counter (right) */}
          <div className="flex justify-between items-center z-20">
            {/* Stash Pin Button */}
            <button
              onClick={handleStashClick}
              title={isStashed ? 'Remove from Stash' : 'Pin to Stash'}
              className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[10px] shadow-xs active:scale-90 transition-transform ${
                isStashed ? 'bg-red-600 text-white' : 'bg-white/90 hover:bg-yellow-300 text-black'
              }`}
            >
              📌
            </button>

            {/* Slide Counter & Zoom Icon */}
            <button
              onClick={handleNextAngle}
              title="Cycle variation"
              className="bg-black/90 hover:bg-black text-white border border-yellow-400/80 text-[9px] font-mono-tag font-bold px-1.5 py-0.2 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span>{activeSlide + 1}/{product.angles.length}</span>
              <span className="text-yellow-300 text-[10px]">⤢</span>
            </button>
          </div>

          {/* Sold Out / Low Stock Overlay Badge */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center">
              <span className="bg-red-600 text-white border border-black font-marker text-xs px-2 py-0.5 tracking-wider uppercase transform -rotate-6 shadow-sm">
                SOLD OUT
              </span>
            </div>
          )}
          {!isSoldOut && isLowStock && (
            <div className="absolute top-7 left-1 z-20">
              <span className="bg-yellow-300 text-black border border-black font-mono-tag font-bold text-[7px] px-1 py-0.2 uppercase shadow-xs">
                LOW STOCK
              </span>
            </div>
          )}

          {/* Garment Graphic / Illustration */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <GarmentGraphic angle={currentAngle} />
          </div>

          {/* Label inside photo frame */}
          <div className="z-20 mt-auto pt-1 flex justify-center">
            <span className="font-marker text-[10px] sm:text-[11px] text-[#fff500] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center line-clamp-1">
              {currentAngle.label}
            </span>
          </div>
        </div>

        {/* Polaroid Bottom Margin (Marker Title & Price) */}
        <div className="mt-2 px-0.5 text-center">
          <h3 className="font-headline font-black text-xs sm:text-[13px] leading-tight tracking-tight text-black uppercase truncate">
            {product.title}
          </h3>

          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            {product.price > 0 ? (
              <>
                <span className="font-typewriter font-bold text-xs text-black">
                  {formatMoney(product.price, currency)}
                </span>
                {product.originalPrice && (
                  <span className="font-typewriter text-[10px] text-red-600 line-through">
                    {formatMoney(product.originalPrice, currency)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-marker text-[11px] text-black tracking-wider">
                ON-BODY PIC
              </span>
            )}
          </div>

          {/* Quick Action bar */}
          <div className="mt-1.5 pt-1 border-t border-dashed border-neutral-300 flex items-center justify-between text-[9px] font-mono-tag text-neutral-600">
            <span className="text-[8px] text-neutral-500 font-typewriter">{product.gsm}</span>
            {product.price > 0 ? (
              isSoldOut ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNotifyMe) {
                      onNotifyMe(product);
                    } else {
                      onOpenStudio(product, activeSlide);
                    }
                  }}
                  className="text-[8px] font-black uppercase tracking-wider text-black bg-[#feef89] hover:bg-yellow-300 border border-black px-1.5 py-0.5 shadow-2xs active:scale-95 cursor-pointer inline-flex items-center gap-1 transition-all"
                  title="Sold out - click to get restock notification"
                >
                  <span>🔔 NOTIFY</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playStampSound();
                    onQuickAdd(product);
                  }}
                  className="text-[9px] font-bold uppercase tracking-wider active:scale-95 text-black hover:text-red-600 cursor-pointer"
                >
                  + BAG
                </button>
              )
            ) : (
              <span className="text-[8px] font-bold text-neutral-700 uppercase">FIT CHECK</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
