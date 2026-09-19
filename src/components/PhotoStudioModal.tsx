import React, { useState, useEffect } from 'react';
import { ProductItem, ProductReview } from '../types';
import { GarmentGraphic } from './GarmentGraphic';
import { CurrencyCode, formatMoney } from '../utils/currency';
import { playStampSound, playPaperRustle } from '../utils/audio';
import { api } from '../lib/api';
import { SizeGuideModal } from './SizeGuideModal';
import { generateZinePdf } from '../utils/zinePdfGenerator';
import { Product360Viewer } from './Product360Viewer';

interface PhotoStudioModalProps {
  product: ProductItem | null;
  initialSlide?: number;
  initialMode?: 'gallery' | 'zoom';
  initialViewMode?: 'still' | '360';
  currency?: CurrencyCode;
  isStashed?: boolean;
  onToggleStash?: (product: ProductItem) => void;
  onOpenSizeGuide?: () => void;
  onClose: () => void;
  onAddToCart: (product: ProductItem, size: string, colorIndex: number) => void;
  onOpenNotifyMe?: (product: ProductItem, size?: string) => void;
}

export const PhotoStudioModal: React.FC<PhotoStudioModalProps> = ({
  product,
  initialSlide = 0,
  initialMode = 'gallery',
  initialViewMode = 'still',
  currency = 'GBP',
  isStashed = false,
  onToggleStash,
  onOpenSizeGuide,
  onClose,
  onAddToCart,
  onOpenNotifyMe,
}) => {
  const [modalMode, setModalMode] = useState<'gallery' | 'zoom'>(initialMode);
  const [viewMode, setViewMode] = useState<'still' | '360'>(initialViewMode);
  const [activeSlide, setActiveSlide] = useState(initialSlide);
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.availableSizes?.[1] || product?.availableSizes?.[0] || 'L'
  );
  const [zoomLevel, setZoomLevel] = useState<'1x' | '2x' | 'macro'>('1x');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const [isInternalSizeGuideOpen, setIsInternalSizeGuideOpen] = useState(false);
  const [isGeneratingZine, setIsGeneratingZine] = useState(false);
  const [zineSuccessMsg, setZineSuccessMsg] = useState<string | null>(null);

  // Reviews State
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFit, setReviewFit] = useState<'small' | 'true-to-size' | 'oversized'>('true-to-size');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Sync activeSlide when initialSlide changes
  useEffect(() => {
    setActiveSlide(initialSlide);
  }, [initialSlide]);

  // Load reviews for this product
  useEffect(() => {
    if (product) {
      api.getReviews(product.id).then((revs) => {
        setReviews(revs || []);
      });
    }
  }, [product]);

  // Handle global Escape key to close modals & R/3 to toggle 360 viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a textarea or input (like reviews)
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isInternalSizeGuideOpen) {
          setIsInternalSizeGuideOpen(false);
        } else if (modalMode === 'zoom') {
          setModalMode('gallery');
        } else {
          onClose();
        }
      } else if (e.key === 'r' || e.key === 'R' || e.key === '3') {
        e.preventDefault();
        playPaperRustle();
        if (modalMode === 'gallery') {
          setViewMode('360');
          setModalMode('zoom');
        } else {
          setViewMode((prev) => (prev === '360' ? 'still' : '360'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInternalSizeGuideOpen, modalMode, onClose]);

  if (!product) return null;

  const currentAngle = product.angles[activeSlide] || product.angles[0];

  const handleAdd = () => {
    if (product.price <= 0) return;
    const sizeStock = product.stock ? product.stock[selectedSize] : 10;
    if (sizeStock === 0) return;

    playStampSound();
    onAddToCart(product, selectedSize, activeSlide);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleDownloadZine = async () => {
    if (!product || isGeneratingZine) return;
    setIsGeneratingZine(true);
    playPaperRustle();
    try {
      await generateZinePdf({
        product,
        activeAngleIndex: activeSlide,
        selectedSize,
        currency,
        onToast: (msg) => {
          setZineSuccessMsg(msg);
          setTimeout(() => setZineSuccessMsg(null), 3500);
        },
      });
      playStampSound();
    } catch (err) {
      console.error('Failed to generate zine spec page PDF', err);
    } finally {
      setIsGeneratingZine(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;

    setReviewSubmitting(true);
    const res = await api.createReview({
      productId: product.id,
      author: reviewAuthor,
      rating: reviewRating,
      fit: reviewFit,
      title: reviewTitle || 'Street Feedback',
      comment: reviewComment,
    });
    setReviewSubmitting(false);

    if (res.success && res.review) {
      setReviews((prev) => [res.review, ...prev]);
      setIsAddingReview(false);
      setReviewComment('');
      setReviewTitle('');
      playStampSound();
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    const res = await api.likeReview(reviewId);
    if (res.success) {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, likes: res.likes } : r))
      );
    }
  };

  // Organic scattering rotation angles for floating gallery cards
  const scatterStyles = [
    { rotate: 'rotate-[-6deg]', hoverRotate: 'hover:rotate-0', translate: 'translate-y-0 sm:translate-y-2' },
    { rotate: 'rotate-[4deg]', hoverRotate: 'hover:rotate-0', translate: 'translate-y-1 sm:-translate-y-4' },
    { rotate: 'rotate-[-2deg]', hoverRotate: 'hover:rotate-0', translate: 'translate-y-0 sm:translate-y-3' },
    { rotate: 'rotate-[3deg]', hoverRotate: 'hover:rotate-0', translate: 'translate-y-2 sm:-translate-y-2' },
  ];

  // 1. FLOATING IMAGE GALLERY MODAL (#floatingGalleryModal)
  if (modalMode === 'gallery') {
    return (
      <div
        id="floatingGalleryModal"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto"
      >
        {/* Fullscreen backdrop with blurred notebook paper */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity cursor-pointer"
          onClick={onClose}
        />

        {/* Floating Modal Content Wrapper */}
        <div className="relative z-10 w-full max-w-5xl my-auto flex flex-col items-center">
          
          {/* Header Bar */}
          <div className="w-full bg-[#fbf9f3] bg-notebook-paper border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3 mb-6 relative">
            {/* Masking tape on header */}
            <div className="absolute -top-3 left-10 w-20 h-5 masking-tape serrated-tape opacity-90 pointer-events-none hidden sm:block" />
            <div className="absolute -top-3 right-20 w-20 h-5 masking-tape-yellow serrated-tape opacity-90 pointer-events-none hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
              <div>
                <h2 className="font-headline font-black text-sm sm:text-base text-black uppercase tracking-tight">
                  TO KNOW NOTHING // VARIATION STUDIO
                </h2>
                <p className="font-typewriter text-[11px] text-neutral-700 hidden sm:block">
                  Click any floating polaroid to open dedicated enlarged zoom & specs sheet
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="bg-[#feef89] border border-black px-2 py-0.5 text-[9px] sm:text-[10px] font-mono-tag font-bold uppercase hidden md:inline-block">
                {product.title}
              </span>
              <button
                id="open360FromGalleryBtn"
                onClick={() => {
                  playPaperRustle();
                  setViewMode('360');
                  setModalMode('zoom');
                }}
                className="bg-black hover:bg-neutral-800 text-[#feef89] border-2 border-black px-2.5 py-1 text-[10px] sm:text-xs font-mono-tag font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Inspect garment in 360-degree rotation turntable"
              >
                <span>🔄</span>
                <span>360° TURNTABLE</span>
              </button>
              <button
                id="downloadZineGalleryBtn"
                onClick={handleDownloadZine}
                disabled={isGeneratingZine}
                className="bg-[#feef89] hover:bg-yellow-300 text-black border-2 border-black px-2.5 py-1 text-[10px] sm:text-xs font-mono-tag font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
                title="Download printable A4 zine page PDF layout with polaroids and garment specs"
              >
                <span>📄</span>
                <span>{isGeneratingZine ? 'COMPILING ZINE...' : 'DOWNLOAD AS ZINE PAGE'}</span>
              </button>
              <button
                id="closeFloatingGalleryBtn"
                onClick={onClose}
                className="bg-black hover:bg-neutral-800 text-white font-mono-tag text-xs font-bold px-3 py-1.5 border border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
              >
                [✕ CLOSE / ESC]
              </button>
            </div>
          </div>

          {/* Cluster of 3-4 Floating Polaroids Scattered Organically */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-4 items-center justify-center">
            {product.angles.map((angle, idx) => {
              const style = scatterStyles[idx % scatterStyles.length];
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSlide(idx);
                    setModalMode('zoom');
                  }}
                  className={`relative group cursor-pointer transition-all duration-300 transform ${style.rotate} ${style.hoverRotate} ${style.translate} hover:scale-105 hover:z-30 w-full max-w-[240px] mx-auto`}
                >
                  {/* Under-layer physical shadow cards */}
                  <div className="absolute inset-0 bg-white border-2 border-black translate-x-1.5 translate-y-2 rotate-2 -z-10 shadow-xs pointer-events-none" />
                  <div className="absolute inset-0 bg-[#f4efe4] border-2 border-black -translate-x-1 translate-y-1 -rotate-1 -z-20 pointer-events-none" />

                  {/* Main Polaroid Shell */}
                  <div className="bg-white border-2 border-black p-2.5 pb-4 polaroid-drop-shadow relative group-hover:shadow-[6px_6px_0px_#000000] transition-shadow">
                    
                    {/* Serrated Masking Tape */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 masking-tape serrated-tape z-30 opacity-95 pointer-events-none shadow-xs">
                      <div className="w-full h-full border-t border-b border-black/10" />
                    </div>

                    {/* 1:1 Aspect Ratio Photo Window */}
                    <div className={`relative w-full aspect-square ${angle.bgClass} border border-black overflow-hidden flex flex-col justify-between p-2`}>
                      
                      {/* Top angle badge & 360 quick-launch */}
                      <div className="flex justify-between items-center z-20">
                        <span className="bg-black/90 text-yellow-300 border border-yellow-400/80 text-[9px] font-mono-tag font-bold px-1.5 py-0.2">
                          {idx + 1}/{product.angles.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            id={`open360CardBtn_${idx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              playPaperRustle();
                              setActiveSlide(idx);
                              setViewMode('360');
                              setModalMode('zoom');
                            }}
                            className="bg-black text-[#feef89] hover:bg-neutral-800 border border-[#feef89] text-[9px] font-mono-tag font-black px-1.5 py-0.2 shadow-xs cursor-pointer flex items-center gap-0.5"
                            title="Open in 360-degree rotation turntable"
                          >
                            <span>🔄</span>
                            <span>360°</span>
                          </button>
                          <span className="bg-yellow-400 text-black text-[9px] font-mono-tag font-bold px-1 py-0.2 shadow-xs">
                            ZOOM ⤢
                          </span>
                        </div>
                      </div>

                      {/* Garment Visual */}
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <GarmentGraphic angle={angle} />
                      </div>

                      {/* Bottom tag inside photo */}
                      <div className="z-20 mt-auto pt-1 flex justify-center">
                        <span className="font-marker text-xs text-[#fff500] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center line-clamp-1">
                          {angle.label}
                        </span>
                      </div>
                    </div>

                    {/* Polaroid Bottom Notes */}
                    <div className="mt-2 text-center">
                      <p className="font-typewriter text-[11px] text-neutral-800 font-bold uppercase truncate">
                        {angle.sublabel}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-mono-tag text-red-600 font-bold">
                        <span>[CLICK TO ENLARGE / 360°]</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom helper prompt */}
          <div className="mt-8 bg-white/95 border border-black px-3 py-1 text-center font-typewriter text-xs text-black shadow-xs">
            ★ ESC to close • [R] or [3] to toggle 360° turntable • Click any floating polaroid for macro fiber weave, specs sheet & size selection
          </div>

        </div>

        {/* Zine Download Toast Notification */}
        {zineSuccessMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#fff500] text-black border-2 border-black px-4 py-2 shadow-[4px_4px_0px_#000000] font-mono-tag text-xs font-black flex items-center gap-2">
            <span>✓</span>
            <span>{zineSuccessMsg}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. LIGHTBOX ENLARGE / ZOOM MODAL (#zoomModal)
  return (
    <div
      id="zoomModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* Fullscreen backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Main Enlarge Studio Box */}
      <div className="relative w-full max-w-4xl bg-[#fbf9f3] bg-notebook-paper border-3 border-black polaroid-drop-shadow-lg p-3 sm:p-6 z-10 my-auto">
        
        {/* Masking tape on top edges */}
        <div className="absolute -top-3 left-10 w-24 h-6 masking-tape serrated-tape z-20 opacity-95 shadow pointer-events-none hidden sm:block" />
        <div className="absolute -top-3 right-16 w-24 h-6 masking-tape-yellow serrated-tape z-20 opacity-95 shadow pointer-events-none hidden sm:block" />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b-2 border-black pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalMode('gallery')}
              className="bg-[#feef89] hover:bg-yellow-300 text-black border border-black px-2 py-0.5 font-mono-tag text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              ← VARIATION STUDIO
            </button>
            <span className="font-mono-tag font-bold text-xs uppercase text-neutral-900 hidden sm:inline-block">
              // ENLARGED ARCHIVE INSPECTOR
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="toggle360HeaderBtn"
              onClick={() => {
                playPaperRustle();
                setViewMode((prev) => (prev === '360' ? 'still' : '360'));
              }}
              className={`border-2 border-black px-2.5 py-1 text-xs font-mono-tag font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer transition-colors ${
                viewMode === '360'
                  ? 'bg-[#feef89] hover:bg-yellow-300 text-black'
                  : 'bg-black text-[#feef89] hover:bg-neutral-800'
              }`}
              title="Toggle between still zoom inspection and 360-degree rotation viewer"
            >
              <span>🔄</span>
              <span>{viewMode === '360' ? 'STILL ZOOM LENS' : '360° ROTATION VIEWER'}</span>
            </button>
            <button
              id="downloadZinePageBtn"
              onClick={handleDownloadZine}
              disabled={isGeneratingZine}
              className="bg-[#feef89] hover:bg-yellow-300 text-black border-2 border-black px-2.5 py-1 text-xs font-mono-tag font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
              title="Download printable A4 zine page PDF layout with polaroids and garment specs"
            >
              <span>📄</span>
              <span>{isGeneratingZine ? 'COMPILING ZINE...' : 'DOWNLOAD AS ZINE PAGE'}</span>
            </button>
            <button
              id="closeZoomModalBtn"
              onClick={onClose}
              className="bg-black hover:bg-neutral-800 text-white font-mono-tag text-xs font-bold px-3 py-1 border border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
            >
              [✕ CLOSE / ESC]
            </button>
          </div>
        </div>

        {/* Studio Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left: 360 Rotation Viewer / Enlarged Polaroid with Zoom Controls */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* View Mode Switcher: Still vs 360 */}
            <div className="w-full max-w-md flex items-center mb-3 border-2 border-black bg-neutral-200 p-0.5 shadow-[2px_2px_0px_#000000]">
              <button
                id="viewModeStillBtn"
                onClick={() => {
                  playPaperRustle();
                  setViewMode('still');
                }}
                className={`flex-1 py-1.5 text-xs font-mono-tag font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === 'still'
                    ? 'bg-black text-[#feef89] shadow-xs'
                    : 'text-neutral-700 hover:text-black hover:bg-white/60'
                }`}
              >
                <span>🔍</span>
                <span>STILL & MACRO ZOOM</span>
              </button>
              <button
                id="viewMode360Btn"
                onClick={() => {
                  playPaperRustle();
                  setViewMode('360');
                }}
                className={`flex-1 py-1.5 text-xs font-mono-tag font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === '360'
                    ? 'bg-black text-[#feef89] shadow-xs'
                    : 'text-neutral-700 hover:text-black hover:bg-white/60'
                }`}
              >
                <span>🔄</span>
                <span>360° TURNTABLE</span>
                <span className="bg-[#feef89] text-black text-[9px] px-1 py-0.2 font-black">DRAG</span>
              </button>
            </div>

            {viewMode === '360' ? (
              <Product360Viewer
                product={product}
                initialAngleIndex={activeSlide}
                onAngleChange={(newIdx) => setActiveSlide(newIdx)}
                onExit360={() => {
                  playPaperRustle();
                  setViewMode('still');
                }}
              />
            ) : (
              <>
                <div className="w-full max-w-md bg-white border-2 border-black p-3 pb-5 polaroid-drop-shadow relative">
                  
                  {/* Serrated Tape swatch */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 masking-tape serrated-tape z-20 opacity-95 shadow" />

                  {/* Photo Viewport */}
                  <div className={`relative w-full aspect-square ${currentAngle.bgClass} border border-black overflow-hidden flex flex-col justify-between p-2.5 select-none`}>
                    
                    {/* Top Overlay Controls */}
                    <div className="flex items-center justify-between z-20">
                      <span className="bg-black/90 text-yellow-300 border border-yellow-400/40 text-[10px] font-mono-tag font-bold px-2 py-0.5">
                        ANGLE {activeSlide + 1} OF {product.angles.length}
                      </span>

                      {/* Zoom Lens Level Selector */}
                      <div className="flex items-center gap-1 bg-black/90 p-0.5 border border-white/30">
                        {(['1x', '2x', 'macro'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setZoomLevel(lvl)}
                            className={`text-[10px] font-mono-tag px-2 py-0.5 transition-colors uppercase ${
                              zoomLevel === lvl
                                ? 'bg-yellow-400 text-black font-bold'
                                : 'text-white hover:text-yellow-200'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Garment Graphic with dynamic Zoom scale */}
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div
                        className={`w-full h-full flex items-center justify-center transition-transform duration-300 ${
                          zoomLevel === '1x'
                            ? 'scale-100'
                            : zoomLevel === '2x'
                            ? 'scale-150 cursor-grab'
                            : 'scale-[2.2] cursor-crosshair'
                        }`}
                      >
                        <GarmentGraphic angle={currentAngle} isZoomed={zoomLevel !== '1x'} />
                      </div>
                    </div>

                    {/* Bottom Label inside Photo */}
                    <div className="z-20 mt-auto pt-2 flex justify-center">
                      <span className="font-marker text-sm md:text-base text-[#fff500] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center">
                        {currentAngle.label}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Label on card */}
                  <div className="mt-2.5 text-center">
                    <h2 className="font-headline font-black text-lg text-black uppercase tracking-tight">
                      {product.title}
                    </h2>
                    <p className="font-typewriter text-xs text-neutral-700 italic mt-0.5">
                      {currentAngle.sublabel}
                    </p>

                    {/* Quick 360 Switch button */}
                    <button
                      id="switchTo360FromPolaroidBtn"
                      onClick={() => {
                        playPaperRustle();
                        setViewMode('360');
                      }}
                      className="mt-2 bg-[#feef89] hover:bg-yellow-300 text-black border border-black px-2.5 py-1 text-[10px] font-mono-tag font-black uppercase shadow-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-colors"
                      title="Switch to 360-degree rotation viewer turntable"
                    >
                      <span>🔄</span>
                      <span>DRAG & ROTATE 360° TURNTABLE</span>
                      <span>➔</span>
                    </button>
                  </div>

                </div>

                {/* Thumbnail Carousel Deck */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                  {product.angles.map((angle, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`flex-shrink-0 w-14 h-14 border-2 p-0.5 relative transition-all ${
                        activeSlide === idx
                          ? 'border-black bg-yellow-100 scale-105 shadow-[2px_2px_0px_#000000]'
                          : 'border-neutral-400 bg-white hover:border-black opacity-75'
                      }`}
                    >
                      <div className={`w-full h-full ${angle.bgClass} flex items-center justify-center overflow-hidden`}>
                        <span className="text-[9px] font-mono-tag font-bold text-white drop-shadow">
                          {idx + 1}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

          </div>

          {/* Right: Technical Specs Sheet & Add to Bag */}
          <div className="lg:col-span-5 space-y-3">
            
            {/* Price Stamp Card */}
            <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_#000000]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono-tag text-[10px] uppercase text-neutral-600 font-bold block">
                    ARCHIVE CATALOG PRICE //
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.originalPrice && (
                      <span className="font-typewriter text-xs text-red-600 line-through">
                        {formatMoney(product.originalPrice, currency)}
                      </span>
                    )}
                    <span className="font-headline font-black text-2xl text-black">
                      {product.price > 0 ? formatMoney(product.price, currency) : 'ON-BODY'}
                    </span>
                  </div>
                </div>

                {/* Stash & Size Guide actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    id="lightboxSizeGuideBtn"
                    onClick={() => {
                      if (onOpenSizeGuide) onOpenSizeGuide();
                      else setIsInternalSizeGuideOpen(true);
                    }}
                    className="bg-[#fbf9f3] hover:bg-yellow-300 text-black border-2 border-black px-2 py-1 text-[10px] font-mono-tag font-bold uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Open 300-500GSM Garment Measurement Schematic"
                  >
                    <span>📏</span>
                    <span>SIZE GUIDE & GSM</span>
                  </button>
                  {onToggleStash && (
                    <button
                      onClick={() => onToggleStash(product)}
                      className={`border px-2 py-1 text-[10px] font-mono-tag font-bold uppercase shadow-xs flex items-center gap-1 ${
                        isStashed ? 'bg-red-600 text-white border-black' : 'bg-white text-black border-black hover:bg-neutral-100'
                      }`}
                    >
                      <span>📌</span>
                      <span>{isStashed ? 'STASHED' : 'STASH'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tabs: Specs vs Street Reviews */}
              <div className="mt-3 pt-2 border-t border-black flex gap-1">
                <button
                  onClick={() => {
                    playPaperRustle();
                    setActiveTab('specs');
                  }}
                  className={`flex-1 py-1 text-xs font-mono-tag font-bold uppercase border border-black ${
                    activeTab === 'specs' ? 'bg-black text-yellow-300' : 'bg-neutral-100 text-neutral-700 hover:bg-white'
                  }`}
                >
                  GARMENT SPECS
                </button>
                <button
                  onClick={() => {
                    playPaperRustle();
                    setActiveTab('reviews');
                  }}
                  className={`flex-1 py-1 text-xs font-mono-tag font-bold uppercase border border-black ${
                    activeTab === 'reviews' ? 'bg-black text-yellow-300' : 'bg-neutral-100 text-neutral-700 hover:bg-white'
                  }`}
                >
                  STREET REVIEWS ({reviews.length})
                </button>
              </div>
            </div>

            {/* TAB 1: SPECS & ADD TO BAG */}
            {activeTab === 'specs' && (
              <>
                {/* Specs Sheet ("100% 480GSM Ring-Spun French Terry...") */}
                <div className="bg-[#f5f3ed] border-2 border-black p-3 space-y-2">
                  <div className="font-marker text-xs text-black tracking-wider uppercase border-b border-black pb-1 flex justify-between">
                    <span>TECHNICAL SPECIFICATIONS SHEET</span>
                    <span className="font-mono-tag font-bold text-[10px] text-red-600">PRE-SHRUNK</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono-tag pt-0.5">
                    <div>
                      <span className="text-neutral-500 block text-[9px]">DENSITY:</span>
                      <span className="font-bold text-black">{product.gsm}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px]">FABRIC:</span>
                      <span className="font-bold text-black">{product.fabric}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-neutral-500 block text-[9px]">SILHOUETTE:</span>
                      <span className="font-bold text-black">{product.fit}</span>
                    </div>
                  </div>

                  <p className="font-typewriter text-xs text-neutral-800 pt-1 leading-relaxed border-t border-dashed border-neutral-400">
                    {product.description}
                  </p>
                </div>

                {/* Printable Zine Page Spec Sheet Card */}
                <div className="bg-[#fbf9f3] border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#feef89] border border-black flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                      📄
                    </div>
                    <div>
                      <div className="font-headline font-black text-xs uppercase tracking-tight text-black flex items-center gap-1.5">
                        <span>PRINTABLE ZINE SPEC SHEET</span>
                        <span className="bg-black text-[#fff500] text-[8px] font-mono-tag px-1 py-0.2 uppercase">
                          PDF
                        </span>
                      </div>
                      <p className="font-typewriter text-[10px] text-neutral-600">
                        A4 printable specs • Polaroid photo contact sheet • Sizing matrix
                      </p>
                    </div>
                  </div>
                  <button
                    id="downloadZinePageSpecsBtn"
                    type="button"
                    onClick={handleDownloadZine}
                    disabled={isGeneratingZine}
                    className="bg-black hover:bg-neutral-800 text-[#fff500] font-mono-tag text-xs font-bold px-3 py-1.5 border border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 flex items-center gap-1 cursor-pointer disabled:opacity-60 transition-all flex-shrink-0"
                    title="Download printable A4 zine page PDF layout with polaroids and garment specs"
                  >
                    <span>{isGeneratingZine ? 'COMPILING...' : 'DOWNLOAD AS ZINE PAGE'}</span>
                    <span>➔</span>
                  </button>
                </div>

                {/* Size Selector */}
                {product.price > 0 && (
                  <div className="bg-white border-2 border-black p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-marker text-xs tracking-wider uppercase text-black">
                        SELECT SIZE (BOXY DROP FIT)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenSizeGuide) onOpenSizeGuide();
                          else setIsInternalSizeGuideOpen(true);
                        }}
                        className="text-[10px] font-mono-tag font-black text-black uppercase underline hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Open interactive 300-500GSM measurement chart"
                      >
                        <span>📏</span>
                        <span>300-500GSM SPECS & CHART</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.availableSizes.map((size) => {
                        const stockQty = product.stock?.[size];
                        const sizeSoldOut = stockQty !== undefined && stockQty === 0;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`px-3 py-1 font-headline font-black text-xs border-2 transition-all relative cursor-pointer ${
                              selectedSize === size
                                ? sizeSoldOut
                                  ? 'bg-neutral-800 text-yellow-300 border-black shadow-[2px_2px_0px_#000000] scale-105'
                                  : 'bg-black text-[#fff500] border-black shadow-[2px_2px_0px_#000000] scale-105'
                                : sizeSoldOut
                                ? 'bg-neutral-100 text-neutral-500 border-neutral-400 hover:border-black'
                                : 'bg-white text-black border-neutral-400 hover:border-black'
                            }`}
                          >
                            <span className={sizeSoldOut ? 'line-through' : ''}>{size}</span>
                            {sizeSoldOut && (
                              <span className="ml-1 text-[7px] text-red-600 font-mono font-bold">
                                [SOLD]
                              </span>
                            )}
                            {stockQty !== undefined && stockQty <= 4 && stockQty > 0 && (
                              <span className="absolute -top-1.5 -right-1 w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CTA Button: ADD TO ARCHIVE BAG or NOTIFY ME */}
                {product.price > 0 ? (
                  product.stock?.[selectedSize] === 0 ? (
                    <div className="space-y-1.5">
                      <button
                        id="notifyMeStudioBtn"
                        type="button"
                        onClick={() => onOpenNotifyMe?.(product, selectedSize)}
                        className="w-full font-headline font-black text-sm py-2.5 px-4 bg-[#feef89] hover:bg-yellow-300 text-black border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>🔔 NOTIFY ME WHEN RESTOCKED ({selectedSize})</span>
                        <span>➔</span>
                      </button>
                      <p className="text-[9px] font-mono text-center text-neutral-600">
                        Size {selectedSize} is currently sold out in London archive. Click to join restock waitlist.
                      </p>
                    </div>
                  ) : (
                    <button
                      id="addToArchiveBagBtn"
                      onClick={handleAdd}
                      className="w-full font-headline font-black text-base py-2.5 px-4 border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer bg-black hover:bg-neutral-800 text-[#fff500]"
                    >
                      {addedSuccess ? (
                        <span className="text-white font-marker tracking-wider">
                          ✓ PINNED TO ARCHIVE BAG!
                        </span>
                      ) : (
                        <>
                          <span>ADD TO ARCHIVE BAG ({selectedSize})</span>
                          <span>➔</span>
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <div className="bg-[#feef89] border-2 border-black p-2.5 text-center font-typewriter text-xs font-bold text-black">
                    LOOKBOOK ARCHIVE ITEM • FIT CHECK INSPIRATION
                  </div>
                )}

                {/* Garment Care Note */}
                <div className="border border-dashed border-neutral-400 p-2 bg-white/70 text-[10px] font-typewriter text-neutral-700 flex items-start gap-1.5">
                  <span className="font-bold text-black">★ NOTE:</span>
                  <span>
                    100% Ring-Spun heavy cotton. Cold wash inside-out, hang dry to preserve drape and screen print.
                  </span>
                </div>
              </>
            )}

            {/* TAB 2: STREET REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="bg-white border-2 border-black p-3 space-y-3 max-h-[360px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <div>
                    <h4 className="font-headline font-black text-xs uppercase">
                      VERIFIED WEARER FEEDBACK
                    </h4>
                    <p className="font-typewriter text-[10px] text-neutral-600">
                      Unfiltered fit, drape, and wash reports
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingReview(!isAddingReview)}
                    className="bg-black text-yellow-300 hover:bg-neutral-800 text-[10px] font-mono-tag font-bold px-2 py-1 border border-black uppercase"
                  >
                    {isAddingReview ? 'CANCEL' : '+ WRITE REVIEW'}
                  </button>
                </div>

                {/* Review Form */}
                {isAddingReview && (
                  <form onSubmit={handlePostReview} className="bg-yellow-50 border border-black p-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="font-mono-tag text-[9px] font-bold block uppercase">NAME / HANDLE</label>
                        <input
                          type="text"
                          required
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          placeholder="@handle"
                          className="w-full bg-white border border-black px-1.5 py-1 text-xs font-typewriter focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-mono-tag text-[9px] font-bold block uppercase">FIT REPORT</label>
                        <select
                          value={reviewFit}
                          onChange={(e) => setReviewFit(e.target.value as any)}
                          className="w-full bg-white border border-black px-1 py-1 text-xs font-mono-tag focus:outline-none"
                        >
                          <option value="true-to-size">True to Size (Boxy)</option>
                          <option value="oversized">Runs Oversized</option>
                          <option value="small">Runs Small</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="font-mono-tag text-[9px] font-bold uppercase">RATING:</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className={`text-sm ${star <= reviewRating ? 'text-black' : 'text-neutral-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-mono-tag text-[9px] font-bold block uppercase">SUMMARY TITLE</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="e.g. Heavyweight champion tee"
                        className="w-full bg-white border border-black px-1.5 py-1 text-xs font-typewriter focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-mono-tag text-[9px] font-bold block uppercase">REVIEW</label>
                      <textarea
                        required
                        rows={2}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="How does it drape? How does it wash?"
                        className="w-full bg-white border border-black px-1.5 py-1 text-xs font-typewriter focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="w-full bg-black text-yellow-300 font-mono-tag text-xs font-bold py-1 border border-black uppercase"
                    >
                      {reviewSubmitting ? 'SUBMITTING...' : 'SUBMIT STREET REVIEW'}
                    </button>
                  </form>
                )}

                {/* Review Cards List */}
                {reviews.length === 0 ? (
                  <p className="font-typewriter text-xs text-neutral-500 py-4 text-center">
                    No street reviews yet. Be the first to submit a wear report!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="border border-neutral-300 p-2 bg-[#fbf9f3] text-xs font-typewriter space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-black font-mono-tag">@{rev.author}</span>
                            <span className="text-yellow-500 font-bold">
                              {'★'.repeat(rev.rating)}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono-tag text-neutral-500">
                            {rev.date.slice(0, 10)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-bold text-black font-headline uppercase">{rev.title}</span>
                          <span className="bg-black text-yellow-300 px-1 py-0.2 font-mono-tag text-[8px] uppercase">
                            FIT: {rev.fit}
                          </span>
                        </div>

                        <p className="text-neutral-800 text-[11px] leading-relaxed">
                          {rev.comment}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[9px] font-mono-tag text-neutral-500 border-t border-neutral-200">
                          <span className="text-green-700">✓ VERIFIED WEARER</span>
                          <button
                            onClick={() => handleLikeReview(rev.id)}
                            className="hover:text-black flex items-center gap-1 font-bold"
                          >
                            <span>👍</span>
                            <span>HELPFUL ({rev.likes})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Interactive Size Guide & 300-500GSM Measurement Schematic Modal */}
      <SizeGuideModal
        isOpen={isInternalSizeGuideOpen}
        onClose={() => setIsInternalSizeGuideOpen(false)}
        product={product}
        selectedSize={selectedSize}
        onSelectSize={(newSize) => {
          setSelectedSize(newSize);
          setIsInternalSizeGuideOpen(false);
        }}
      />

      {/* Zine Download Toast Notification */}
      {zineSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#fff500] text-black border-2 border-black px-4 py-2 shadow-[4px_4px_0px_#000000] font-mono-tag text-xs font-black flex items-center gap-2">
          <span>✓</span>
          <span>{zineSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
