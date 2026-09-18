/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CategoryId, ProductSortOption, ProductItem, CartItem, DropBannerConfig } from './types';
import { INITIAL_PRODUCTS } from './data/catalogData';
import { api } from './lib/api';
import { NavigationSidebar } from './components/NavigationSidebar';
import { HeaderBar } from './components/HeaderBar';
import { PolaroidCard } from './components/PolaroidCard';
import { WhatsNewBanner } from './components/WhatsNewBanner';
import { ZineFooter } from './components/ZineFooter';
import { PhotoStudioModal } from './components/PhotoStudioModal';
import { OrderBagModal } from './components/OrderBagModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminConsole } from './components/AdminConsole';
import { ZineInfoModal, InfoModalType } from './components/ZineInfoModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { WishlistModal } from './components/WishlistModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { NotifyMeModal } from './components/NotifyMeModal';
import { applyMetaTagsToDocument } from './utils/seo';
import { useArchiveShortcuts } from './hooks/useArchiveShortcuts';
import { loadWishlistIds, saveWishlistIds } from './utils/wishlistStorage';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('best-seller');
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [studioProduct, setStudioProduct] = useState<ProductItem | null>(null);
  const [studioInitialSlide, setStudioInitialSlide] = useState<number>(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('TKN-9021');
  const [infoModal, setInfoModal] = useState<InfoModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bannerConfig, setBannerConfig] = useState<DropBannerConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<ProductSortOption>('featured');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadWishlistIds());
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isGlobalSizeGuideOpen, setIsGlobalSizeGuideOpen] = useState(false);
  const [cartBumpTrigger, setCartBumpTrigger] = useState<number>(0);

  // Waitlist (Notify Me) modal state
  const [notifyProduct, setNotifyProduct] = useState<ProductItem | null>(null);
  const [notifyInitialSize, setNotifyInitialSize] = useState<string | undefined>(undefined);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Persist wishlist IDs to localStorage whenever updated
  useEffect(() => {
    saveWishlistIds(wishlistIds);
  }, [wishlistIds]);

  // Global Keyboard Shortcuts Hook
  useArchiveShortcuts({
    onToggleBag: () => {
      setIsCartOpen((prev) => !prev);
      if (isAdminOpen) setIsAdminOpen(false);
      if (isTrackerOpen) setIsTrackerOpen(false);
      if (studioProduct) setStudioProduct(null);
      if (infoModal) setInfoModal(null);
      if (isShortcutsOpen) setIsShortcutsOpen(false);
      if (isWishlistOpen) setIsWishlistOpen(false);
    },
    onToggleWishlist: () => {
      setIsWishlistOpen((prev) => !prev);
      if (isCartOpen) setIsCartOpen(false);
      if (isAdminOpen) setIsAdminOpen(false);
      if (isTrackerOpen) setIsTrackerOpen(false);
      if (studioProduct) setStudioProduct(null);
      if (infoModal) setInfoModal(null);
      if (isShortcutsOpen) setIsShortcutsOpen(false);
      if (isGlobalSizeGuideOpen) setIsGlobalSizeGuideOpen(false);
    },
    onToggleSizeGuide: () => {
      setIsGlobalSizeGuideOpen((prev) => !prev);
      if (isCartOpen) setIsCartOpen(false);
      if (isAdminOpen) setIsAdminOpen(false);
      if (isTrackerOpen) setIsTrackerOpen(false);
      if (infoModal) setInfoModal(null);
      if (isShortcutsOpen) setIsShortcutsOpen(false);
      if (isWishlistOpen) setIsWishlistOpen(false);
    },
    onFocusSearch: () => {
      // Close active modals so user can see search input
      if (isCartOpen) setIsCartOpen(false);
      if (isAdminOpen) setIsAdminOpen(false);
      if (isTrackerOpen) setIsTrackerOpen(false);
      if (studioProduct) setStudioProduct(null);
      if (infoModal) setInfoModal(null);
      if (isShortcutsOpen) setIsShortcutsOpen(false);
      if (isWishlistOpen) setIsWishlistOpen(false);
      if (isGlobalSizeGuideOpen) setIsGlobalSizeGuideOpen(false);

      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 30);
    },
    onCloseModals: () => {
      if (isGlobalSizeGuideOpen) {
        setIsGlobalSizeGuideOpen(false);
      } else if (isShortcutsOpen) {
        setIsShortcutsOpen(false);
      } else if (isWishlistOpen) {
        setIsWishlistOpen(false);
      } else if (studioProduct) {
        setStudioProduct(null);
      } else if (isCartOpen) {
        setIsCartOpen(false);
      } else if (isAdminOpen) {
        setIsAdminOpen(false);
      } else if (isTrackerOpen) {
        setIsTrackerOpen(false);
      } else if (infoModal) {
        setInfoModal(null);
      } else if (searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    },
    onOpenTracker: () => {
      setIsTrackerOpen(true);
      setIsCartOpen(false);
      setIsAdminOpen(false);
      setStudioProduct(null);
      setInfoModal(null);
      setIsShortcutsOpen(false);
      setIsWishlistOpen(false);
    },
    onOpenAdmin: () => {
      setIsAdminOpen(true);
      setIsCartOpen(false);
      setIsTrackerOpen(false);
      setStudioProduct(null);
      setInfoModal(null);
      setIsShortcutsOpen(false);
      setIsWishlistOpen(false);
    },
    onToggleShortcutsModal: () => {
      setIsShortcutsOpen((prev) => !prev);
    },
    onSelectCategoryIndex: (index) => {
      const categories: CategoryId[] = [
        'best-seller',
        'whats-new',
        'hoodies',
        'shirts',
        'sweatshirts',
        'pants',
      ];
      if (categories[index]) {
        setActiveCategory(categories[index]);
        showToast(`[${index + 1}] JUMP: ${categories[index].toUpperCase()}`);
      }
    },
    isAnyModalOpen: Boolean(
      studioProduct || isCartOpen || isAdminOpen || isTrackerOpen || infoModal || isShortcutsOpen || isWishlistOpen
    ),
  });

  // Sync products and drop banner from backend API
  const refreshProducts = async () => {
    try {
      const serverProducts = await api.getProducts();
      if (serverProducts && serverProducts.length > 0) {
        // Merge with angles and visual assets from INITIAL_PRODUCTS
        const merged = serverProducts.map((sp) => {
          const init = INITIAL_PRODUCTS.find((p) => p.id === sp.id);
          return {
            ...sp,
            angles: sp.angles || init?.angles || INITIAL_PRODUCTS[0].angles,
            currentSlide: 0,
            totalSlides: sp.angles?.length || init?.totalSlides || 3,
          };
        });
        setProducts(merged);
      }
    } catch (e) {
      console.warn('Using local catalog fallback', e);
    }
  };

  const refreshBanner = async () => {
    try {
      const b = await api.getBanner();
      if (b) setBannerConfig(b);
    } catch (e) {
      // ignore
    }
  };

  const refreshMetaTags = async () => {
    try {
      const meta = await api.getMetaTags();
      if (meta) applyMetaTagsToDocument(meta);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshBanner();
    refreshMetaTags();
  }, []);

  // Filter and sort products based on selected category, search query & sort option
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      // Search query filter (matches title, GSM, fabric, fit, description, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          product.title.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          (product.gsm && product.gsm.toLowerCase().includes(q)) ||
          (product.fabric && product.fabric.toLowerCase().includes(q)) ||
          (product.fit && product.fit.toLowerCase().includes(q)) ||
          (product.description && product.description.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      if (activeCategory === 'all') return true;
      if (activeCategory === 'best-seller') {
        return ['acid-box-tee', '500gsm-hoodie', 'raw-edge-crew', 'waffle-thermal', 'skate-pant', 'lookbook-01'].includes(
          product.id
        );
      }
      if (activeCategory === 'whats-new') {
        return ['heavy-zip-hoodie', 'acid-box-tee', 'skate-pant'].includes(product.id);
      }
      if (activeCategory === 'hoodies') {
        return product.category === 'hoodies';
      }
      if (activeCategory === 'shirts') {
        return product.category === 'shirts';
      }
      if (activeCategory === 'sweatshirts') {
        return product.category === 'sweatshirts';
      }
      if (activeCategory === 'pants') {
        return product.category === 'pants';
      }
      if (activeCategory === 'lookbook') {
        return product.category === 'lookbook';
      }
      return true;
    });

    // Apply active sorting
    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'newest') {
      const getNewDropScore = (p: ProductItem) => {
        if (p.badge && /new|friday|drop|fresh/i.test(p.badge)) return 4;
        if (['heavy-zip-hoodie', 'acid-box-tee', 'skate-pant'].includes(p.id)) return 3;
        if (p.badge && /hot|restock|staple/i.test(p.badge)) return 2;
        return 1;
      };
      return [...list].sort((a, b) => getNewDropScore(b) - getNewDropScore(a));
    }

    return list;
  }, [products, searchQuery, activeCategory, sortBy]);

  const getCategoryTitle = () => {
    if (searchQuery.trim()) {
      return `SEARCH: "${searchQuery.toUpperCase()}" (${filteredProducts.length} ITEMS)`;
    }
    switch (activeCategory) {
      case 'best-seller':
        return 'BEST SELLERS';
      case 'whats-new':
        return "WHAT'S NEW DROP";
      case 'hoodies':
        return 'HEAVY HOODIES (500-550 GSM)';
      case 'shirts':
        return 'HEAVY BOX TEES & THERMALS';
      case 'sweatshirts':
        return 'RAW EDGE SWEATSHIRTS';
      case 'pants':
        return 'WORKWEAR DUCK CANVAS PANTS';
      case 'lookbook':
        return 'STREET LOOKBOOK EDITORIAL';
      default:
        return 'COMPLETE ARCHIVE CATALOG';
    }
  };

  // Cart operations
  const handleAddToCart = (product: ProductItem, size = 'L', colorIndex = 0) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColorIndex === colorIndex
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      } else {
        return [...prev, { product, selectedSize: size, selectedColorIndex: colorIndex, quantity: 1 }];
      }
    });
    setCartBumpTrigger(Date.now());
    showToast(`✓ ${product.title} (${size}) PINNED TO BAG!`);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems((prev) => {
      const next = [...prev];
      next[index].quantity = newQty;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
    showToast('✕ ITEM REMOVED FROM BAG');
  };

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight * 0.7,
      behavior: 'smooth',
    });
  };

  // Wishlist operations
  const handleToggleWishlist = (product: ProductItem) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        showToast(`📌 REMOVED "${product.title}" FROM STASH`);
        return prev.filter((id) => id !== product.id);
      } else {
        showToast(`📌 PINNED "${product.title}" TO STASH!`);
        return [...prev, product.id];
      }
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    showToast('✕ REMOVED PIECE FROM STASH');
  };

  const handleClearWishlist = () => {
    setWishlistIds([]);
    showToast('✕ CLEARED ENTIRE PINNED STASH');
  };

  const handleAddAllWishlistToBag = () => {
    const stashed = products.filter((p) => {
      if (!wishlistIds.includes(p.id)) return false;
      if (!p.stock) return true;
      const totalStock = Object.values(p.stock).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
      return totalStock > 0;
    });
    if (stashed.length === 0) {
      showToast('NO IN-STOCK PIECES FOUND IN STASH');
      return;
    }
    stashed.forEach((p) => {
      const size = p.availableSizes?.[0] || 'L';
      handleAddToCart(p, size);
    });
    showToast(`✓ ADDED ${stashed.length} PINNED PIECES TO BAG!`);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  // Global key listener for escape
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isWishlistOpen) setIsWishlistOpen(false);
        if (isCartOpen) setIsCartOpen(false);
        if (isAdminOpen) setIsAdminOpen(false);
        if (isTrackerOpen) setIsTrackerOpen(false);
        if (infoModal) setInfoModal(null);
        if (studioProduct) setStudioProduct(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isShortcutsOpen, isWishlistOpen, isCartOpen, isAdminOpen, isTrackerOpen, infoModal, studioProduct]);

  return (
    <div className="min-h-screen bg-[#fbf9f3] text-black font-sans selection:bg-yellow-300 selection:text-black">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 bg-black text-[#fff500] border-2 border-black font-headline font-bold text-xs sm:text-sm px-3.5 py-1.5 shadow-[3px_3px_0px_#000000] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 1. Left Pinned Sidebar (fixed top-0 left-0 h-screen w-36 sm:w-44 z-40) */}
      <NavigationSidebar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        counts={{
          bestSeller: 6,
          whatsNew: 3,
          hoodies: products.filter((p) => p.category === 'hoodies').length || 8,
          shirts: products.filter((p) => p.category === 'shirts').length || 14,
          sweatshirts: products.filter((p) => p.category === 'sweatshirts').length || 6,
        }}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSketchInfo={() => setInfoModal('sketch')}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
      />

      {/* 2. Top Pinned Header Bar (fixed top-0 left-36 sm:left-44 right-0 h-12 z-30) */}
      <HeaderBar
        activeCategoryLabel={getCategoryTitle()}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        searchInputRef={searchInputRef}
        sortBy={sortBy}
        onSortChange={(sort) => {
          setSortBy(sort);
          const sortLabels: Record<ProductSortOption, string> = {
            'featured': 'DEFAULT ARCHIVE',
            'newest': 'NEWEST DROP',
            'price-asc': 'PRICE: LOW → HIGH',
            'price-desc': 'PRICE: HIGH → LOW',
          };
          showToast(`SORTED: ${sortLabels[sort]}`);
        }}
        products={products}
        onSelectProduct={(product) => {
          setStudioProduct(product);
          setStudioInitialSlide(0);
        }}
        onSelectCategory={(catId) => {
          setActiveCategory(catId);
          setSearchQuery('');
          showToast(`CATEGORY: ${catId.toUpperCase()}`);
        }}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onScrollDown={handleScrollDown}
      />

      {/* 3. Main Scrollable Content Canvas (offset for pinned chrome) */}
      <main
        ref={mainScrollRef}
        id="mainNotebookCanvas"
        className="pl-36 sm:pl-44 pt-14 pb-32 min-h-screen bg-[#fbf9f3] bg-notebook-paper notebook-ruled red-margin-guide relative"
      >
        <div className="max-w-[1400px] mx-auto px-2.5 sm:px-5">
          
          {/* Section Header: Hand-drawn highlighter & sub-notes */}
          <div className="pt-3 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-neutral-300 select-none">
            <div className="flex flex-wrap items-center gap-2">
              {/* Highlighter Yellow Box behind title */}
              <div className="bg-[#feef89] border-2 border-black px-3 py-0.5 shadow-[2px_2px_0px_#000000] transform -rotate-1 inline-block">
                <span className="font-marker text-lg sm:text-xl md:text-2xl tracking-wide text-black uppercase">
                  {getCategoryTitle()}
                </span>
              </div>

              {/* Active Sort Tag when sorting is active */}
              {sortBy !== 'featured' && (
                <span 
                  id="activeSortBadge"
                  className="bg-black text-yellow-300 border-2 border-black text-[9px] sm:text-[10px] font-mono-tag font-bold px-2 py-0.5 tracking-wider uppercase inline-flex items-center gap-1.5 shadow-[1px_1px_0px_#000000]"
                >
                  <span>SORT: {sortBy === 'newest' ? '🔥 NEWEST DROP' : sortBy === 'price-asc' ? '£ LOW → HIGH' : '£ HIGH → LOW'}</span>
                  <button
                    onClick={() => {
                      setSortBy('featured');
                      showToast('SORTED: DEFAULT ARCHIVE');
                    }}
                    className="text-white hover:text-red-400 font-mono font-black ml-1 text-xs cursor-pointer"
                    title="Reset to default archive order"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Doodle Mini Mountain/Triangle sketch icon */}
              <svg viewBox="0 0 24 18" className="w-5 h-4 fill-black ml-0.5 hidden sm:inline">
                <polygon points="0,18 7,5 14,18" />
                <polygon points="11,18 17,2 24,18" />
              </svg>
            </div>

            {/* Sub-note & Shortcuts / Admin Shortcut */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="hidden sm:inline-flex bg-white hover:bg-neutral-100 text-black border border-black font-mono-tag font-bold text-[10px] sm:text-xs px-2 py-0.5 uppercase shadow-xs items-center gap-1 cursor-pointer"
                title="Keyboard Shortcuts [?]"
              >
                <span>⌨️</span>
                <span>KEYS [?]</span>
              </button>

              <button
                onClick={() => setIsAdminOpen(true)}
                className="bg-black text-yellow-300 hover:bg-neutral-800 border border-black font-mono-tag font-bold text-[10px] sm:text-xs px-2 py-0.5 uppercase shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>⚡</span>
                <span>ARCHIVE ADMIN</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-neutral-800">
                <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block animate-ping" />
                <span className="font-architect font-bold text-xs text-neutral-900">
                  ★ Click polaroid to inspect
                </span>
              </div>
            </div>
          </div>

          {/* 4. Compact Polaroid Product Grid */}
          <div className="pt-5 pb-8">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white border-2 border-black max-w-md mx-auto my-6 shadow-[3px_3px_0px_#000000] font-mono-tag">
                <p className="font-headline font-black text-sm uppercase text-black">
                  NO GARMENTS FOUND MATCHING "{searchQuery}"
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Try searching for "500GSM", "hoodie", "tee", "thermal", or "pant".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 bg-black text-yellow-300 font-bold px-3 py-1 text-xs border border-black uppercase cursor-pointer hover:bg-neutral-800"
                >
                  CLEAR SEARCH [ESC]
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 items-start">
                {filteredProducts.map((product, index) => (
                  <PolaroidCard
                    key={product.id}
                    product={product}
                    index={index}
                    isStashed={wishlistIds.includes(product.id)}
                    onToggleStash={handleToggleWishlist}
                    onOpenStudio={(prod, slide) => {
                      setStudioProduct(prod);
                      setStudioInitialSlide(slide ?? 0);
                    }}
                    onQuickAdd={(prod) => handleAddToCart(prod)}
                    onNotifyMe={(prod) => {
                      setNotifyProduct(prod);
                      setNotifyInitialSize(undefined);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Additional Notebook Archive Notes & Technical Drawing stamp */}
          <div className="my-6 p-4 bg-white/80 border-2 border-dashed border-black/70 max-w-xl mx-auto text-center transform rotate-0.5 shadow-xs">
            <div className="inline-block bg-black text-yellow-300 text-[9px] font-mono-tag font-bold px-2 py-0.5 mb-1.5 uppercase">
              TO KNOW NOTHING ARCHIVE // FULL-STACK E-COMMERCE SUITE
            </div>
            <p className="font-typewriter text-xs text-neutral-800 italic leading-relaxed">
              "Heavyweight fabrics pre-shrunk in artisan dye houses. Managed end-to-end via Express REST backend on port 3000: live stock tracking, warehouse dispatching, automated discount codes, and customer waybill lookups."
            </p>
            <div className="mt-2.5 flex justify-center gap-3 text-[10px] font-mono-tag font-bold text-neutral-600">
              <button onClick={() => setIsTrackerOpen(true)} className="hover:text-black underline">
                [TRACK AN EXISTING ORDER]
              </button>
              <span>•</span>
              <button onClick={() => setIsAdminOpen(true)} className="hover:text-black underline">
                [OPEN MANAGEMENT CONSOLE]
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* 5. Pinned "What's New Drop" Banner (fixed bottom-9 left-36 sm:left-44 right-0 z-30) */}
      <WhatsNewBanner
        bannerConfig={bannerConfig}
        onExploreDrop={() => {
          setActiveCategory('whats-new');
          setInfoModal('drop');
        }}
      />

      {/* 6. Pinned Bottom Bar / Footer (fixed bottom-0 left-0 right-0 h-9 z-40) */}
      <ZineFooter
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenModal={(type) => setInfoModal(type)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSizeGuide={() => setIsGlobalSizeGuideOpen(true)}
        cartBumpTrigger={cartBumpTrigger}
      />

      {/* Floating Photo Studio & Zoom Lightbox Modals (#floatingGalleryModal & #zoomModal) */}
      {studioProduct && (
        <PhotoStudioModal
          product={studioProduct}
          initialSlide={studioInitialSlide}
          initialMode="gallery"
          isStashed={wishlistIds.includes(studioProduct.id)}
          onToggleStash={handleToggleWishlist}
          onClose={() => setStudioProduct(null)}
          onAddToCart={(prod, size, colorIdx) => {
            handleAddToCart(prod, size, colorIdx);
            setStudioProduct(null);
          }}
          onOpenNotifyMe={(prod, size) => {
            setNotifyProduct(prod);
            setNotifyInitialSize(size);
          }}
        />
      )}

      {/* Restock Notification / Waitlist Modal */}
      <NotifyMeModal
        isOpen={Boolean(notifyProduct)}
        onClose={() => {
          setNotifyProduct(null);
          setNotifyInitialSize(undefined);
        }}
        product={notifyProduct}
        initialSize={notifyInitialSize}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Shopping Bag / Order Slip & Multi-Step Checkout Modal */}
      <OrderBagModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        onTrackOrder={(orderId) => {
          setTrackingOrderId(orderId);
          setIsTrackerOpen(true);
        }}
      />

      {/* Pinned Wishlist / Stash Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        stashedItems={products.filter((p) => wishlistIds.includes(p.id))}
        onRemoveFromStash={handleRemoveFromWishlist}
        onAddToCart={(prod, sz) => handleAddToCart(prod, sz)}
        onAddAllToCart={handleAddAllWishlistToBag}
        onClearStash={handleClearWishlist}
        onOpenStudio={(prod) => {
          setIsWishlistOpen(false);
          setStudioProduct(prod);
          setStudioInitialSlide(0);
        }}
        currency="USD"
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialOrderId={trackingOrderId}
      />

      {/* Comprehensive E-Commerce Admin Console */}
      <AdminConsole
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshStoreProducts={refreshProducts}
        products={products}
        onMetaUpdated={(updatedMeta) => applyMetaTagsToDocument(updatedMeta)}
      />

      {/* Zine Info / Manifesto / Contact / Drop Modals */}
      <ZineInfoModal
        type={infoModal}
        onClose={() => setInfoModal(null)}
      />

      {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Global Size Guide & 300-500GSM Measurement Schematic Modal */}
      <SizeGuideModal
        isOpen={isGlobalSizeGuideOpen}
        onClose={() => setIsGlobalSizeGuideOpen(false)}
        product={studioProduct}
      />

    </div>
  );
}
