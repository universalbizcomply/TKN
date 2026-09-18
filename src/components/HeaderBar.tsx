import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Keyboard, ArrowUpDown, Tag, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { ProductSortOption, ProductItem, CategoryId } from '../types';

interface HeaderBarProps {
  activeCategoryLabel?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  sortBy?: ProductSortOption;
  onSortChange?: (sort: ProductSortOption) => void;
  products?: ProductItem[];
  onSelectProduct?: (product: ProductItem) => void;
  onSelectCategory?: (category: CategoryId) => void;
  onOpenShortcuts?: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onScrollDown: () => void;
}

interface CategorySuggestion {
  id: CategoryId;
  label: string;
  tag: string;
  keywords: string[];
}

const CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
  { id: 'best-seller', label: 'BEST SELLERS', tag: 'HOT', keywords: ['best', 'seller', 'popular', 'top', 'hot', 'fave'] },
  { id: 'whats-new', label: "WHAT'S NEW DROP", tag: 'NEW', keywords: ['new', 'drop', 'friday', 'latest', 'recent', 'fresh'] },
  { id: 'hoodies', label: 'HEAVY HOODIES (500GSM)', tag: '500GSM', keywords: ['hoodie', 'hoodies', 'fleece', '500gsm', '550gsm', 'pullover', 'zip'] },
  { id: 'shirts', label: 'BOX TEES & THERMALS', tag: '300GSM', keywords: ['tee', 'tees', 't-shirt', 'shirt', 'shirts', 'box', 'waffle', 'thermal', '300gsm', 'acid', 'cotton'] },
  { id: 'sweatshirts', label: 'RAW EDGE SWEATSHIRTS', tag: '450GSM', keywords: ['sweatshirt', 'sweatshirts', 'crew', 'crewneck', 'raw', 'edge', '450gsm', 'heavy'] },
  { id: 'pants', label: 'WORKWEAR CANVAS PANTS', tag: 'DUCK', keywords: ['pant', 'pants', 'canvas', 'duck', 'trousers', 'skate', 'workwear', 'bottoms'] },
  { id: 'all', label: 'FULL ARCHIVE CATALOG', tag: 'ALL', keywords: ['all', 'full', 'catalog', 'everything', 'archive'] },
];

const POPULAR_SEARCH_TAGS = ['500GSM', 'Acid Box Tee', 'Heavy Hoodie', 'Duck Canvas', 'Raw Edge', 'Waffle Thermal'];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchInputRef,
  sortBy = 'featured',
  onSortChange,
  products = [],
  onSelectProduct,
  onSelectCategory,
  onOpenShortcuts,
  wishlistCount = 0,
  onOpenWishlist,
  onScrollDown,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const queryTrimmed = searchQuery.trim().toLowerCase();

  // Filter matching categories
  const matchingCategories = useMemo(() => {
    if (!queryTrimmed) return [];
    return CATEGORY_SUGGESTIONS.filter((cat) => {
      return (
        cat.label.toLowerCase().includes(queryTrimmed) ||
        cat.tag.toLowerCase().includes(queryTrimmed) ||
        cat.keywords.some((kw) => kw.includes(queryTrimmed) || queryTrimmed.includes(kw))
      );
    });
  }, [queryTrimmed]);

  // Filter matching products (prioritize title matches, then GSM/fabric/badge)
  const matchingProducts = useMemo(() => {
    if (!queryTrimmed) return [];
    const directTitleMatches: ProductItem[] = [];
    const otherMatches: ProductItem[] = [];

    products.forEach((p) => {
      const titleMatch = p.title.toLowerCase().includes(queryTrimmed);
      const catMatch = p.category.toLowerCase().includes(queryTrimmed);
      const gsmMatch = p.gsm && p.gsm.toLowerCase().includes(queryTrimmed);
      const fabricMatch = p.fabric && p.fabric.toLowerCase().includes(queryTrimmed);
      const badgeMatch = p.badge && p.badge.toLowerCase().includes(queryTrimmed);
      const descMatch = p.description && p.description.toLowerCase().includes(queryTrimmed);

      if (titleMatch) {
        directTitleMatches.push(p);
      } else if (catMatch || gsmMatch || fabricMatch || badgeMatch || descMatch) {
        otherMatches.push(p);
      }
    });

    return [...directTitleMatches, ...otherMatches].slice(0, 5);
  }, [products, queryTrimmed]);

  // Combined selectable items for keyboard navigation
  const selectableItems = useMemo(() => {
    const items: Array<
      | { type: 'category'; data: CategorySuggestion }
      | { type: 'product'; data: ProductItem }
    > = [];

    matchingCategories.forEach((cat) => items.push({ type: 'category', data: cat }));
    matchingProducts.forEach((p) => items.push({ type: 'product', data: p }));

    return items;
  }, [matchingCategories, matchingProducts]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setActiveHighlightIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleSelectProduct = (product: ProductItem) => {
    setIsDropdownOpen(false);
    setActiveHighlightIndex(-1);
    onSelectProduct?.(product);
  };

  const handleSelectCategory = (catId: CategoryId) => {
    setIsDropdownOpen(false);
    setActiveHighlightIndex(-1);
    onSelectCategory?.(catId);
  };

  const handleApplyTag = (tag: string) => {
    onSearchChange?.(tag);
    setIsDropdownOpen(true);
    searchInputRef?.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || selectableItems.length === 0) {
      if (e.key === 'ArrowDown' && (queryTrimmed || isInputFocused)) {
        setIsDropdownOpen(true);
        setActiveHighlightIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveHighlightIndex((prev) => (prev + 1) % selectableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveHighlightIndex((prev) =>
        prev <= 0 ? selectableItems.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeHighlightIndex >= 0 && activeHighlightIndex < selectableItems.length) {
        const item = selectableItems[activeHighlightIndex];
        if (item.type === 'category') {
          handleSelectCategory(item.data.id);
        } else if (item.type === 'product') {
          handleSelectProduct(item.data);
        }
      } else if (matchingProducts.length > 0) {
        handleSelectProduct(matchingProducts[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setActiveHighlightIndex(-1);
      searchInputRef?.current?.blur();
    }
  };

  const showDropdown = isDropdownOpen && (queryTrimmed.length > 0 || isInputFocused);

  return (
    <header 
      id="topPinnedHeader"
      className="fixed top-0 left-36 sm:left-44 right-0 h-12 z-30 bg-[#fbf9f3] bg-notebook-paper border-b-2 border-black flex items-center justify-between px-2.5 sm:px-4 select-none shadow-xs gap-2"
    >
      {/* Left: Brand Logo + ARCHIVE Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block animate-pulse" />
        <h1 className="inline-flex items-center gap-1 sm:gap-1.5">
          <span className="font-headline font-black text-xs sm:text-base tracking-tighter text-black uppercase">
            TO KNOW NOTHING™
          </span>
          <span className="bg-black text-white text-[8px] sm:text-[9px] font-mono-tag font-bold px-1.5 py-0.2 tracking-wider uppercase">
            ARCHIVE
          </span>
        </h1>
      </div>

      {/* Middle: Archive Search Input + Autocomplete Dropdown + Sorting Dropdown */}
      <div 
        ref={searchContainerRef}
        className="relative flex-1 max-w-sm sm:max-w-md lg:max-w-lg mx-1 sm:mx-3 flex items-center gap-1.5 sm:gap-2"
      >
        {/* Search Input Container */}
        <div className="relative flex-1 min-w-[100px] flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 pointer-events-none" />
          <input
            id="archiveSearchInput"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange?.(e.target.value);
              setIsDropdownOpen(true);
              setActiveHighlightIndex(-1);
            }}
            onFocus={() => {
              setIsInputFocused(true);
              setIsDropdownOpen(true);
            }}
            onBlur={() => {
              setIsInputFocused(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search (e.g. 500GSM, hoodie)..."
            className="w-full bg-white border-2 border-black pl-7 pr-12 sm:pr-14 py-1 text-[10px] sm:text-[11px] font-mono-tag text-black placeholder:text-neutral-400 outline-none focus:bg-yellow-50 focus:border-black focus:shadow-[2px_2px_0px_#000000] transition-all"
            autoComplete="off"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                onSearchChange?.('');
                setActiveHighlightIndex(-1);
                searchInputRef?.current?.focus();
              }}
              className="absolute right-1.5 text-neutral-500 hover:text-black p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-1.5 pointer-events-none hidden sm:inline-flex items-center bg-neutral-100 border border-neutral-400 text-[8px] sm:text-[9px] font-bold font-mono-tag px-1 py-0.2 text-neutral-600 rounded-xs shadow-2xs">
              S
            </kbd>
          )}

          {/* Autocomplete Dropdown Popover */}
          {showDropdown && (
            <div
              id="searchAutocompleteDropdown"
              className="absolute top-full left-0 w-[270px] sm:w-[350px] md:w-[410px] mt-1.5 bg-[#fbf9f3] bg-notebook-paper border-2 border-black shadow-[4px_4px_0px_#000000] z-50 max-h-[420px] overflow-y-auto no-scrollbar font-mono-tag select-none text-black"
            >
              {/* Header Bar */}
              <div className="bg-[#feef89] border-b-2 border-black px-2.5 py-1 flex items-center justify-between">
                <span className="text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-black" />
                  {queryTrimmed ? `SEARCH INDEX: "${queryTrimmed.toUpperCase()}"` : 'ARCHIVE DISCOVER & SUGGESTIONS'}
                </span>
                <span className="text-[8px] font-bold text-neutral-800">
                  {selectableItems.length} MATCH{selectableItems.length === 1 ? '' : 'ES'}
                </span>
              </div>

              {/* 1. Category Matches */}
              {matchingCategories.length > 0 && (
                <div className="p-2 border-b border-black/30 bg-yellow-50/50">
                  <div className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    MATCHING CATEGORIES
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingCategories.map((cat, idx) => {
                      const isHighlighted = activeHighlightIndex === idx;
                      return (
                        <button
                          key={cat.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCategory(cat.id);
                          }}
                          className={`border border-black px-2 py-0.5 text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                            isHighlighted
                              ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000000]'
                              : 'bg-white hover:bg-yellow-200 text-black shadow-xs'
                          }`}
                        >
                          <span>📁</span>
                          <span>{cat.label}</span>
                          <span className="bg-black/10 text-neutral-800 text-[8px] px-1 font-black">
                            {cat.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Product Matches */}
              {matchingProducts.length > 0 ? (
                <div className="divide-y divide-black/20">
                  <div className="px-2.5 py-1 bg-neutral-100 border-b border-black/20 text-[8px] font-black uppercase tracking-widest text-neutral-600">
                    MATCHING GARMENTS ({matchingProducts.length})
                  </div>
                  {matchingProducts.map((product, pIdx) => {
                    const itemGlobalIndex = matchingCategories.length + pIdx;
                    const isHighlighted = activeHighlightIndex === itemGlobalIndex;

                    return (
                      <div
                        key={product.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectProduct(product);
                        }}
                        onMouseEnter={() => setActiveHighlightIndex(itemGlobalIndex)}
                        className={`p-2 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isHighlighted
                            ? 'bg-yellow-200 text-black border-l-4 border-black pl-2'
                            : 'hover:bg-yellow-100/70 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Mini GSM Tag indicator */}
                          <div className="w-8 h-8 shrink-0 bg-neutral-900 border border-black flex flex-col items-center justify-center text-white text-[7px] font-black leading-tight shadow-xs">
                            <span>{product.gsm ? product.gsm.replace(' GSM', '') : 'HVY'}</span>
                            <span className="text-[6px] text-yellow-300">GSM</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-headline font-black text-[11px] sm:text-xs tracking-tight text-black truncate uppercase">
                                {product.title}
                              </span>
                              {product.badge && (
                                <span className="bg-[#feef89] text-black border border-black text-[7px] font-mono-tag font-black px-1 py-0.2 uppercase">
                                  {product.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[8px] sm:text-[9px] text-neutral-600 truncate mt-0.5">
                              {product.fabric || product.fit || product.category}
                            </p>
                          </div>
                        </div>

                        {/* Price & Action button */}
                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <div className="font-headline font-black text-xs text-black">
                            £{product.price.toFixed(2)}
                            {product.originalPrice && (
                              <span className="block text-[8px] font-mono text-neutral-500 line-through">
                                £{product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <span className="w-5 h-5 bg-white border border-black rounded-none flex items-center justify-center text-black text-[10px] shadow-2xs">
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : queryTrimmed.length > 0 && matchingCategories.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="font-marker text-sm text-neutral-700 uppercase">
                    NO ARCHIVE GARMENTS MATCHING "{queryTrimmed}"
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-1">
                    Try searching by GSM weight (500GSM), wash (acid), or fit (boxy).
                  </p>
                </div>
              ) : null}

              {/* 3. Popular Search Chips (shown when query is empty or few matches) */}
              <div className="p-2.5 bg-neutral-100/90 border-t border-black/20">
                <div className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1">
                  <span>★ POPULAR ARCHIVE QUERIES</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleApplyTag(tag);
                      }}
                      className="bg-white hover:bg-black hover:text-white border border-black px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-neutral-800 cursor-pointer shadow-2xs transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer navigation cues */}
              <div className="bg-black text-neutral-300 text-[8px] px-2.5 py-1 flex items-center justify-between tracking-wider font-mono">
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="w-2.5 h-2.5 text-yellow-300" />
                  <span>[ENTER] OPEN</span>
                  <span className="mx-1 text-neutral-600">•</span>
                  <span>[↑/↓] NAVIGATE</span>
                </span>
                <span className="text-yellow-300 font-bold">[ESC] CLOSE</span>
              </div>
            </div>
          )}
        </div>

        {/* Sorting Dropdown (Price low-to-high, high-to-low, newest drop) */}
        <div className="relative flex items-center shrink-0">
          <label htmlFor="archiveSortSelect" className="sr-only">
            Sort Archive Products
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-1.5 sm:left-2 pointer-events-none text-black flex items-center">
              <ArrowUpDown className="w-3 h-3 text-neutral-900" />
            </span>
            <select
              id="archiveSortSelect"
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value as ProductSortOption)}
              className={`border-2 border-black pl-5 sm:pl-6 pr-5 sm:pr-6 py-1 text-[9px] sm:text-[10px] font-mono-tag font-bold uppercase outline-none shadow-[1px_1px_0px_#000000] focus:shadow-[2px_2px_0px_#000000] transition-all cursor-pointer appearance-none ${
                sortBy !== 'featured'
                  ? 'bg-yellow-300 text-black font-black ring-1 ring-black'
                  : 'bg-white hover:bg-neutral-100 text-neutral-900'
              }`}
              title="Sort products by price or newest drop"
            >
              <option value="featured">SORT: DEFAULT</option>
              <option value="newest">🔥 NEWEST DROP</option>
              <option value="price-asc">£ LOW → HIGH</option>
              <option value="price-desc">£ HIGH → LOW</option>
            </select>
            <span className="absolute right-1.5 sm:right-2 pointer-events-none text-[7px] sm:text-[8px] font-mono font-black text-black">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Right: Wishlist Stash, Keyboard shortcut toggle, Ticker & Scroll trigger */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onOpenWishlist && (
          <button
            id="headerWishlistButton"
            onClick={onOpenWishlist}
            className="inline-flex items-center gap-1 bg-white hover:bg-yellow-100 border border-black px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono-tag font-bold text-black cursor-pointer shadow-xs active:scale-95 transition-all"
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
            <kbd className="hidden lg:inline bg-neutral-100 text-neutral-500 border border-neutral-300 text-[8px] px-1 font-mono">
              W
            </kbd>
          </button>
        )}

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hidden md:inline-flex items-center gap-1 bg-white hover:bg-neutral-100 border border-black px-1.5 py-0.5 text-[9px] font-mono-tag font-bold text-black cursor-pointer shadow-2xs"
            title="Keyboard Shortcuts [?]"
          >
            <Keyboard className="w-3 h-3" />
            <span>[?] KEYS</span>
          </button>
        )}

        <div className="hidden lg:inline-flex bg-[#feef89] border border-black px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-mono-tag font-bold tracking-tight shadow-xs transform -rotate-1">
          <span>[🇬🇧 LONDON, UK // 100% HEAVY]</span>
        </div>

        <button
          onClick={onScrollDown}
          className="flex items-center gap-1 text-[10px] sm:text-xs font-architect text-black font-bold hover:underline cursor-pointer select-none"
        >
          <span>☆ scroll →</span>
        </button>
      </div>
    </header>
  );
};

