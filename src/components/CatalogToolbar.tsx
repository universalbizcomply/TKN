import React from 'react';
import { CurrencyCode, CURRENCIES } from '../utils/currency';

export type SortOption = 'curated' | 'price-asc' | 'price-desc' | 'gsm-desc' | 'title-asc';

interface CatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  inStockOnly: boolean;
  onInStockToggle: () => void;
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  soundActive: boolean;
  onToggleSound: () => void;
  totalCount: number;
  onOpenStash: () => void;
  stashCount: number;
  onOpenSizeGuide: () => void;
}

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  inStockOnly,
  onInStockToggle,
  selectedCurrency,
  onCurrencyChange,
  soundActive,
  onToggleSound,
  totalCount,
  onOpenStash,
  stashCount,
  onOpenSizeGuide,
}) => {
  return (
    <div 
      id="catalogFilterToolbar"
      className="my-3 p-2 sm:p-3 bg-[#fbf9f3] bg-notebook-paper border-2 border-black shadow-[3px_3px_0px_#000000] flex flex-col md:flex-row md:items-center justify-between gap-2.5 select-none"
    >
      {/* Left: Search input + Results count */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-mono-tag">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cut, 500 GSM, tee, canvas..."
            className="w-full bg-white border-2 border-black pl-8 pr-7 py-1 text-xs font-typewriter text-black placeholder:text-neutral-500 focus:outline-none focus:bg-yellow-50 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="hidden sm:inline-block bg-black text-yellow-300 px-2 py-1 text-[9px] font-mono-tag font-bold border border-black uppercase tracking-wider whitespace-nowrap">
          {totalCount} ITEMS
        </div>
      </div>

      {/* Right Controls: Sort, In-Stock, Currency, Stash, Size Guide, Audio */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Sort Select */}
        <div className="flex items-center gap-1 bg-white border border-black px-2 py-0.5 shadow-xs">
          <span className="text-[9px] font-mono-tag font-bold uppercase text-neutral-500">SORT:</span>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs font-mono-tag font-bold uppercase bg-transparent text-black focus:outline-none cursor-pointer"
          >
            <option value="curated">★ Street Pick</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="gsm-desc">Fabric: Heaviest (GSM)</option>
            <option value="title-asc">Title: A → Z</option>
          </select>
        </div>

        {/* In Stock Filter Toggle */}
        <button
          onClick={onInStockToggle}
          className={`border px-2 py-1 text-[10px] font-mono-tag font-bold uppercase transition-all shadow-xs flex items-center gap-1 ${
            inStockOnly
              ? 'bg-black text-yellow-300 border-black'
              : 'bg-white text-neutral-700 border-black hover:bg-neutral-100'
          }`}
        >
          <span>{inStockOnly ? '✓' : '○'}</span>
          <span>IN STOCK ONLY</span>
        </button>

        {/* Currency Switcher */}
        <div className="flex items-center bg-white border border-black px-1.5 py-0.5 shadow-xs">
          <select
            value={selectedCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="text-xs font-mono-tag font-bold text-black bg-transparent focus:outline-none cursor-pointer uppercase"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>

        {/* Size Guide Button */}
        <button
          onClick={onOpenSizeGuide}
          className="bg-white hover:bg-yellow-50 text-black border border-black px-2 py-1 text-[10px] font-mono-tag font-bold uppercase shadow-xs flex items-center gap-1"
        >
          <span>📏</span>
          <span className="hidden xs:inline">SIZE GUIDE</span>
        </button>

        {/* Wishlist / Stash Button */}
        <button
          id="openStashButton"
          onClick={onOpenStash}
          className={`border px-2 py-1 text-[10px] font-mono-tag font-bold uppercase transition-all shadow-xs flex items-center gap-1 ${
            stashCount > 0
              ? 'bg-red-600 text-white border-black'
              : 'bg-white text-black border-black hover:bg-neutral-100'
          }`}
        >
          <span>📌</span>
          <span>STASH ({stashCount})</span>
        </button>

        {/* Tactile Audio Mute/Unmute */}
        <button
          onClick={onToggleSound}
          title={soundActive ? 'Mute tactile zine audio' : 'Unmute tactile zine audio'}
          className={`border px-2 py-1 text-[10px] font-mono-tag font-bold uppercase shadow-xs flex items-center gap-1 ${
            soundActive ? 'bg-yellow-300 text-black border-black' : 'bg-neutral-200 text-neutral-500 border-neutral-400'
          }`}
        >
          <span>{soundActive ? '🔊' : '🔇'}</span>
        </button>
      </div>
    </div>
  );
};
