import React, { useState, useEffect } from 'react';
import { ProductItem } from '../types';

export interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductItem | null;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

type GarmentType = 'tees' | 'hoodies' | 'crews' | 'pants';
type DimensionKey = 'chest' | 'length' | 'shoulder' | 'sleeve' | 'hem' | 'waist' | 'inseam' | 'rise' | 'legOpening';

interface MeasurementRow {
  size: string;
  chest?: number;
  length?: number;
  shoulder?: number;
  sleeve?: number;
  hem?: number;
  waist?: number;
  inseam?: number;
  rise?: number;
  legOpening?: number;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedSize: initialSelectedSize,
  onSelectSize,
}) => {
  // Determine initial garment type from product
  const getInitialGarmentType = (): GarmentType => {
    if (!product) return 'tees';
    const cat = product.category;
    const title = product.title.toLowerCase();
    if (cat === 'hoodies' || title.includes('hoodie')) return 'hoodies';
    if (cat === 'sweatshirts' || title.includes('crew') || title.includes('sweat')) return 'crews';
    if (cat === 'pants' || title.includes('pant')) return 'pants';
    return 'tees';
  };

  const [activeCategory, setActiveCategory] = useState<GarmentType>(getInitialGarmentType());
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [activeSize, setActiveSize] = useState<string>(initialSelectedSize || 'L');
  const [highlightedDim, setHighlightedDim] = useState<DimensionKey | null>(null);

  // Quick Fit Finder State
  const [userHeight, setUserHeight] = useState<'short' | 'regular' | 'tall' | 'very-tall'>('regular');
  const [userFitPreference, setUserFitPreference] = useState<'true-boxy' | 'fitted' | 'oversized'>('true-boxy');

  // Update category when product changes
  useEffect(() => {
    if (product) {
      setActiveCategory(getInitialGarmentType());
      if (initialSelectedSize) {
        setActiveSize(initialSelectedSize);
      } else if (product.availableSizes && product.availableSizes.length > 0) {
        setActiveSize(product.availableSizes[Math.min(1, product.availableSizes.length - 1)] || 'L');
      }
    }
  }, [product, initialSelectedSize]);

  if (!isOpen) return null;

  // 1. Precise Measurement Data (in Inches as base)
  const measurements: Record<GarmentType, MeasurementRow[]> = {
    tees: [
      { size: 'S', chest: 22.0, length: 28.0, shoulder: 21.5, sleeve: 8.5, hem: 22.0 },
      { size: 'M', chest: 23.5, length: 29.0, shoulder: 22.5, sleeve: 9.0, hem: 23.5 },
      { size: 'L', chest: 25.0, length: 30.0, shoulder: 23.5, sleeve: 9.5, hem: 25.0 },
      { size: 'XL', chest: 26.5, length: 31.0, shoulder: 24.5, sleeve: 10.0, hem: 26.5 },
      { size: 'XXL', chest: 28.0, length: 32.0, shoulder: 25.5, sleeve: 10.5, hem: 28.0 },
    ],
    hoodies: [
      { size: 'S', chest: 24.5, length: 26.0, shoulder: 23.5, sleeve: 24.0, hem: 20.5 },
      { size: 'M', chest: 26.0, length: 27.0, shoulder: 25.0, sleeve: 24.5, hem: 22.0 },
      { size: 'L', chest: 27.5, length: 28.0, shoulder: 26.5, sleeve: 25.0, hem: 23.5 },
      { size: 'XL', chest: 29.0, length: 29.0, shoulder: 28.0, sleeve: 25.5, hem: 25.0 },
      { size: 'XXL', chest: 30.5, length: 30.0, shoulder: 29.5, sleeve: 26.0, hem: 26.5 },
    ],
    crews: [
      { size: 'S', chest: 23.5, length: 26.5, shoulder: 22.5, sleeve: 23.5, hem: 20.0 },
      { size: 'M', chest: 25.0, length: 27.5, shoulder: 23.5, sleeve: 24.0, hem: 21.5 },
      { size: 'L', chest: 26.5, length: 28.5, shoulder: 25.0, sleeve: 24.5, hem: 23.0 },
      { size: 'XL', chest: 28.0, length: 29.5, shoulder: 26.5, sleeve: 25.0, hem: 24.5 },
      { size: 'XXL', chest: 29.5, length: 30.5, shoulder: 27.5, sleeve: 25.5, hem: 26.0 },
    ],
    pants: [
      { size: '30', waist: 31.5, inseam: 30.0, rise: 12.0, legOpening: 9.0 },
      { size: '32', waist: 33.5, inseam: 31.0, rise: 12.5, legOpening: 9.5 },
      { size: '34', waist: 35.5, inseam: 32.0, rise: 13.0, legOpening: 10.0 },
      { size: '36', waist: 37.5, inseam: 32.5, rise: 13.5, legOpening: 10.2 },
      { size: '38', waist: 39.5, inseam: 33.0, rise: 14.0, legOpening: 10.5 },
    ],
  };

  // Convert measurement helper
  const formatVal = (inches?: number) => {
    if (inches === undefined) return '-';
    if (unit === 'in') return `${inches.toFixed(1)}"`;
    return `${Math.round(inches * 2.54)} cm`;
  };

  const rows = measurements[activeCategory];
  const activeRow = rows.find((r) => r.size === activeSize) || rows[2] || rows[0];

  // Dynamic Fit Recommendation
  const getRecommendedSize = (): string => {
    if (activeCategory === 'pants') {
      if (userHeight === 'short') return '30';
      if (userHeight === 'regular') return '32';
      if (userHeight === 'tall') return '34';
      return '36';
    }

    if (userHeight === 'short') {
      if (userFitPreference === 'fitted') return 'S';
      if (userFitPreference === 'true-boxy') return 'S';
      return 'M';
    } else if (userHeight === 'regular') {
      if (userFitPreference === 'fitted') return 'S';
      if (userFitPreference === 'true-boxy') return 'M';
      return 'L';
    } else if (userHeight === 'tall') {
      if (userFitPreference === 'fitted') return 'M';
      if (userFitPreference === 'true-boxy') return 'L';
      return 'XL';
    } else {
      if (userFitPreference === 'fitted') return 'L';
      if (userFitPreference === 'true-boxy') return 'XL';
      return 'XXL';
    }
  };

  const recommendedSize = getRecommendedSize();

  // Dimension explanations
  const dimensionGuides: Record<DimensionKey, { label: string; tag: string; how: string }> = {
    chest: {
      label: 'CHEST WIDTH (PIT-TO-PIT)',
      tag: 'DIMENSION A',
      how: 'Measured flat 1" below the lower armhole seam across the garment.',
    },
    length: {
      label: 'BODY LENGTH (HPS TO HEM)',
      tag: 'DIMENSION B',
      how: 'Measured straight down from highest point of shoulder (next to collar) to the bottom hem.',
    },
    shoulder: {
      label: 'SHOULDER DROP / WIDTH',
      tag: 'DIMENSION C',
      how: 'Measured seam-to-seam straight across upper back yoke. Engineered with an aggressive drop.',
    },
    sleeve: {
      label: 'SLEEVE LENGTH',
      tag: 'DIMENSION D',
      how: 'Measured from top shoulder seam down to cuff edge.',
    },
    hem: {
      label: 'BOTTOM HEM OPENING',
      tag: 'DIMENSION E',
      how: 'Measured flat along the bottom rib or edge, relaxed.',
    },
    waist: {
      label: 'WAISTBAND CIRCUMFERENCE',
      tag: 'DIMENSION A',
      how: 'Measured flat across waistband aligned, multiplied by 2.',
    },
    inseam: {
      label: 'INSEAM LENGTH',
      tag: 'DIMENSION B',
      how: 'From center crotch fork down the inner leg seam to bottom leg hem.',
    },
    rise: {
      label: 'FRONT RISE',
      tag: 'DIMENSION C',
      how: 'From center crotch junction up to the top of waistband.',
    },
    legOpening: {
      label: 'LEG CUFF OPENING',
      tag: 'DIMENSION D',
      how: 'Measured flat across bottom leg opening.',
    },
  };

  // Category GSM Specs
  const gsmSpecs = {
    tees: {
      badge: '300-340 GSM',
      title: 'HEAVYWEIGHT COMPACT JERSEY',
      desc: '100% Ring-spun 16s double-ply combed cotton. High density weave delivers a stiff, architectural box drape that holds its shape away from the torso rather than clinging.',
      collar: '1.25" Dense 1x1 Bound Rib Collar',
      shrinkage: '< 1% (Sanforized pre-shrunk)',
      weightFeel: 'Solid, crisp hand-feel with zero translucency',
    },
    hoodies: {
      badge: '480-500 GSM',
      title: 'ULTRA-DENSE REVERSE FLEECE',
      desc: 'Double-faced heavyweight cotton fleece. Thick dual-layer crossover hood without eyelets or cords, 550GSM ribbed side body gussets for freedom of movement and boxy structure.',
      collar: 'Seamless Double-Ply Structural Hood',
      shrinkage: 'Zero shrinkage (Enzyme washed)',
      weightFeel: 'Armor-grade heavyweight warmth (Approx 1.2kg garment weight)',
    },
    crews: {
      badge: '400-440 GSM',
      title: 'COMBED LOOPBACK FRENCH TERRY',
      desc: 'Unbrushed diagonal loop interior for all-season breathability and heft. 4-needle flatlock construction with 450GSM stretch cuffs and hem.',
      collar: 'Heavy 2x2 Ribbed Crew Collar',
      shrinkage: '< 1.5% Cold Wash',
      weightFeel: 'Drapey heavyweight warmth with structured shoulders',
    },
    pants: {
      badge: '380-420 GSM (14 OZ)',
      title: 'HEAVY COTTON DUCK CANVAS',
      desc: 'Dense custom woven canvas with reinforced double-knee panels and triple chainstitching. Wide, relaxed straight skate profile with slight knee taper.',
      collar: 'Reinforced 1.75" Belt Loops',
      shrinkage: 'Pre-washed (No shrinkage)',
      weightFeel: 'Abrasion-resistant rugged workwear feel',
    },
  };

  const currentGsm = gsmSpecs[activeCategory];

  return (
    <div
      id="sizeGuideModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto"
    >
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Zine Blueprint Container */}
      <div
        className="relative z-10 w-full max-w-4xl bg-[#fbf9f3] bg-notebook-paper border-4 border-black p-3 sm:p-6 shadow-[8px_8px_0px_#000000] max-h-[94vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Tape & Inspection Stamp */}
        <div className="absolute -top-3.5 left-10 sm:left-14 w-32 h-5 masking-tape-yellow serrated-tape pointer-events-none z-20" />
        <div className="absolute top-3 right-14 hidden md:block pointer-events-none opacity-80 rotate-3">
          <span className="border-2 border-red-600 text-red-600 px-2 py-0.5 font-stamp text-[9px] font-black uppercase tracking-widest">
            300-500GSM CERTIFIED SPECS
          </span>
        </div>

        {/* Top Header Bar */}
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-yellow-300 font-mono-tag font-bold text-[10px] px-2 py-0.5 uppercase tracking-wider shadow-xs">
                📐 TECHNICAL SPEC SHEET
              </span>
              <span className="font-mono-tag text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 uppercase">
                {currentGsm.badge}
              </span>
            </div>
            <h2 className="font-headline font-black text-base sm:text-xl uppercase text-black mt-1">
              GARMENT MEASUREMENT & FIT SCHEMATIC
            </h2>
            <p className="font-typewriter text-[11px] text-neutral-600 hidden sm:block">
              Precision blueprint measurements for boxy drop-shoulder heavyweight streetwear blanks.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-white hover:bg-black hover:text-white border-2 border-black font-headline font-bold text-sm flex items-center justify-center shadow-xs cursor-pointer active:translate-y-0.5 shrink-0"
            title="Close [Esc]"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="my-3 overflow-y-auto flex-1 pr-1 space-y-4">
          
          {/* Controls Bar: Category Selector & Unit Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-white p-2 shadow-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-mono-tag text-[9px] text-neutral-500 font-bold uppercase mr-1 hidden sm:inline">
                CATEGORY:
              </span>
              <button
                onClick={() => {
                  setActiveCategory('tees');
                  setActiveSize('L');
                }}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono-tag font-bold uppercase border-2 transition-all cursor-pointer ${
                  activeCategory === 'tees'
                    ? 'bg-black text-yellow-300 border-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-black border-neutral-300 hover:border-black'
                }`}
              >
                300GSM TEES
              </button>
              <button
                onClick={() => {
                  setActiveCategory('hoodies');
                  setActiveSize('L');
                }}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono-tag font-bold uppercase border-2 transition-all cursor-pointer ${
                  activeCategory === 'hoodies'
                    ? 'bg-black text-yellow-300 border-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-black border-neutral-300 hover:border-black'
                }`}
              >
                500GSM HOODIES
              </button>
              <button
                onClick={() => {
                  setActiveCategory('crews');
                  setActiveSize('L');
                }}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono-tag font-bold uppercase border-2 transition-all cursor-pointer ${
                  activeCategory === 'crews'
                    ? 'bg-black text-yellow-300 border-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-black border-neutral-300 hover:border-black'
                }`}
              >
                440GSM CREWS
              </button>
              <button
                onClick={() => {
                  setActiveCategory('pants');
                  setActiveSize('32');
                }}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono-tag font-bold uppercase border-2 transition-all cursor-pointer ${
                  activeCategory === 'pants'
                    ? 'bg-black text-yellow-300 border-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-black border-neutral-300 hover:border-black'
                }`}
              >
                400GSM PANTS
              </button>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center border-2 border-black bg-neutral-100 p-0.5">
              <span className="font-mono-tag text-[9px] font-bold px-1 text-neutral-500 uppercase">
                UNITS:
              </span>
              <button
                onClick={() => setUnit('in')}
                className={`px-2 py-0.5 text-[10px] font-mono-tag font-black cursor-pointer transition-all ${
                  unit === 'in' ? 'bg-black text-yellow-300 shadow-xs' : 'text-neutral-700 hover:text-black'
                }`}
              >
                INCHES (")
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-2 py-0.5 text-[10px] font-mono-tag font-black cursor-pointer transition-all ${
                  unit === 'cm' ? 'bg-black text-yellow-300 shadow-xs' : 'text-neutral-700 hover:text-black'
                }`}
              >
                CM
              </button>
            </div>
          </div>

          {/* GSM Fabric Specs Strip */}
          <div className="bg-[#feef89] border-2 border-black p-2.5 sm:p-3 shadow-[3px_3px_0px_#000]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-headline font-black text-xs sm:text-sm uppercase text-black">
                  ★ {currentGsm.title}
                </span>
                <span className="bg-black text-white text-[9px] font-mono px-1.5 py-0.2 font-bold uppercase">
                  {currentGsm.badge}
                </span>
              </div>
              <span className="font-mono-tag text-[9px] text-neutral-800 font-bold">
                COLLAR: {currentGsm.collar}
              </span>
            </div>
            <p className="font-typewriter text-xs text-neutral-900 mt-1.5 leading-relaxed">
              {currentGsm.desc}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-1.5 border-t border-black/20 text-[10px] font-mono-tag">
              <div>
                <span className="text-neutral-600 block text-[8px] uppercase">FEEL & DRAPE:</span>
                <span className="font-bold text-black">{currentGsm.weightFeel}</span>
              </div>
              <div>
                <span className="text-neutral-600 block text-[8px] uppercase">SHRINKAGE:</span>
                <span className="font-bold text-red-700">{currentGsm.shrinkage}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-neutral-600 block text-[8px] uppercase">CONSTRUCTION:</span>
                <span className="font-bold text-black">Heavy Ribbed Side Gussets</span>
              </div>
            </div>
          </div>

          {/* Interactive Schematic Diagram & Sizing Matrix Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            
            {/* Left 5 Cols: Visual Interactive Blueprint SVG */}
            <div className="lg:col-span-5 bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000] flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-black pb-1.5 mb-2">
                <span className="font-headline font-black text-xs uppercase flex items-center gap-1 text-black">
                  <span>📐</span>
                  <span>INTERACTIVE SCHEMATIC</span>
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono-tag text-neutral-500">SIZE:</span>
                  <span className="bg-yellow-300 text-black px-1.5 py-0.2 border border-black font-headline font-black text-xs">
                    {activeSize}
                  </span>
                </div>
              </div>

              {/* Garment Blueprint SVG Canvas */}
              <div className="relative w-full aspect-square max-w-[280px] bg-[#f8f7f2] border border-neutral-300 p-2 flex items-center justify-center overflow-hidden">
                {/* Millimeter Grid Background */}
                <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#000" strokeWidth="0.75" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* TEES & TOPS SCHEMATIC */}
                {activeCategory === 'tees' && (
                  <svg viewBox="0 0 320 280" className="w-full h-full relative z-10">
                    {/* T-Shirt Vector Path */}
                    <path
                      d="M 125,36 C 145,52 175,52 195,36 L 255,62 L 285,115 L 250,132 L 230,110 L 230,245 L 90,245 L 90,110 L 70,132 L 35,115 L 65,62 Z"
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Thick Collar Ribbing */}
                    <path
                      d="M 125,36 C 145,52 175,52 195,36 C 175,25 145,25 125,36 Z"
                      fill="#e5e5e5"
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    {/* Fold Crease Detail */}
                    <line x1="90" y1="110" x2="105" y2="120" stroke="#aaa" strokeWidth="1.5" />
                    <line x1="230" y1="110" x2="215" y2="120" stroke="#aaa" strokeWidth="1.5" />

                    {/* [A] Chest Width Line */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHighlightedDim('chest')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('chest')}
                    >
                      <line
                        x1="90"
                        y1="120"
                        x2="230"
                        y2="120"
                        stroke={highlightedDim === 'chest' ? '#dc2626' : '#2563eb'}
                        strokeWidth={highlightedDim === 'chest' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <polygon points="90,120 98,116 98,124" fill={highlightedDim === 'chest' ? '#dc2626' : '#2563eb'} />
                      <polygon points="230,120 222,116 222,124" fill={highlightedDim === 'chest' ? '#dc2626' : '#2563eb'} />
                      <rect x="135" y="109" width="50" height="20" fill="#000000" rx="2" />
                      <text x="160" y="123" textAnchor="middle" fill="#fff500" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        A: {formatVal(activeRow.chest)}
                      </text>
                    </g>

                    {/* [B] Body Length Line */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHighlightedDim('length')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('length')}
                    >
                      <line
                        x1="175"
                        y1="42"
                        x2="175"
                        y2="245"
                        stroke={highlightedDim === 'length' ? '#dc2626' : '#16a34a'}
                        strokeWidth={highlightedDim === 'length' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <polygon points="175,42 171,50 179,50" fill={highlightedDim === 'length' ? '#dc2626' : '#16a34a'} />
                      <polygon points="175,245 171,237 179,237" fill={highlightedDim === 'length' ? '#dc2626' : '#16a34a'} />
                      <rect x="150" y="165" width="50" height="20" fill="#000000" rx="2" />
                      <text x="175" y="179" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        B: {formatVal(activeRow.length)}
                      </text>
                    </g>

                    {/* [C] Shoulder Drop Line */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHighlightedDim('shoulder')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('shoulder')}
                    >
                      <line
                        x1="65"
                        y1="62"
                        x2="255"
                        y2="62"
                        stroke={highlightedDim === 'shoulder' ? '#dc2626' : '#9333ea'}
                        strokeWidth={highlightedDim === 'shoulder' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <polygon points="65,62 73,58 73,66" fill={highlightedDim === 'shoulder' ? '#dc2626' : '#9333ea'} />
                      <polygon points="255,62 247,58 247,66" fill={highlightedDim === 'shoulder' ? '#dc2626' : '#9333ea'} />
                      <rect x="135" y="52" width="50" height="18" fill="#000000" rx="2" />
                      <text x="160" y="65" textAnchor="middle" fill="#fff500" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        C: {formatVal(activeRow.shoulder)}
                      </text>
                    </g>

                    {/* [D] Sleeve Length */}
                    <g
                      className="cursor-pointer group"
                      onMouseEnter={() => setHighlightedDim('sleeve')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('sleeve')}
                    >
                      <line
                        x1="65"
                        y1="62"
                        x2="35"
                        y2="115"
                        stroke={highlightedDim === 'sleeve' ? '#dc2626' : '#ea580c'}
                        strokeWidth={highlightedDim === 'sleeve' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="20" y="75" width="46" height="18" fill="#000000" rx="2" />
                      <text x="43" y="88" textAnchor="middle" fill="#fff500" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        D: {formatVal(activeRow.sleeve)}
                      </text>
                    </g>
                  </svg>
                )}

                {/* 500GSM HOODIES SCHEMATIC */}
                {activeCategory === 'hoodies' && (
                  <svg viewBox="0 0 320 280" className="w-full h-full relative z-10">
                    {/* Double-Ply Crossover Hood */}
                    <path
                      d="M 120,65 C 100,20 130,5 160,5 C 190,5 220,20 200,65 C 180,72 140,72 120,65 Z"
                      fill="#e5e5e5"
                      stroke="#000000"
                      strokeWidth="3.5"
                    />
                    {/* Body and Dropped Sleeves */}
                    <path
                      d="M 120,65 L 60,80 L 25,190 L 52,198 L 78,125 L 82,245 L 238,245 L 242,125 L 268,198 L 295,190 L 260,80 L 200,65 Z"
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Kangaroo Pocket */}
                    <path
                      d="M 105,180 C 105,160 115,150 135,150 L 185,150 C 205,150 215,160 215,180 L 215,230 L 105,230 Z"
                      fill="#f3f1e8"
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    {/* Ribbed Hem Band */}
                    <rect x="82" y="235" width="156" height="15" fill="#e5e5e5" stroke="#000000" strokeWidth="2" />

                    {/* [A] Chest Line */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHighlightedDim('chest')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('chest')}
                    >
                      <line
                        x1="82"
                        y1="130"
                        x2="238"
                        y2="130"
                        stroke={highlightedDim === 'chest' ? '#dc2626' : '#2563eb'}
                        strokeWidth={highlightedDim === 'chest' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="135" y="119" width="50" height="20" fill="#000000" rx="2" />
                      <text x="160" y="133" textAnchor="middle" fill="#fff500" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        A: {formatVal(activeRow.chest)}
                      </text>
                    </g>

                    {/* [B] Length Line */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHighlightedDim('length')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('length')}
                    >
                      <line
                        x1="180"
                        y1="68"
                        x2="180"
                        y2="250"
                        stroke={highlightedDim === 'length' ? '#dc2626' : '#16a34a'}
                        strokeWidth={highlightedDim === 'length' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="155" y="185" width="50" height="20" fill="#000000" rx="2" />
                      <text x="180" y="199" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        B: {formatVal(activeRow.length)}
                      </text>
                    </g>
                  </svg>
                )}

                {/* 440GSM CREWS SCHEMATIC */}
                {activeCategory === 'crews' && (
                  <svg viewBox="0 0 320 280" className="w-full h-full relative z-10">
                    <path
                      d="M 125,45 C 145,60 175,60 195,45 L 255,70 L 290,185 L 265,192 L 235,120 L 235,245 L 85,245 L 85,120 L 55,192 L 30,185 L 65,70 Z"
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Ribbed Collar */}
                    <path
                      d="M 125,45 C 145,60 175,60 195,45 C 175,32 145,32 125,45 Z"
                      fill="#e5e5e5"
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    {/* Ribbed Hem & Cuffs */}
                    <rect x="85" y="235" width="150" height="15" fill="#e5e5e5" stroke="#000000" strokeWidth="2" />

                    {/* [A] Chest Line */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHighlightedDim('chest')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('chest')}
                    >
                      <line
                        x1="85"
                        y1="125"
                        x2="235"
                        y2="125"
                        stroke={highlightedDim === 'chest' ? '#dc2626' : '#2563eb'}
                        strokeWidth={highlightedDim === 'chest' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="135" y="114" width="50" height="20" fill="#000000" rx="2" />
                      <text x="160" y="128" textAnchor="middle" fill="#fff500" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        A: {formatVal(activeRow.chest)}
                      </text>
                    </g>

                    {/* [B] Length Line */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHighlightedDim('length')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('length')}
                    >
                      <line
                        x1="175"
                        y1="48"
                        x2="175"
                        y2="250"
                        stroke={highlightedDim === 'length' ? '#dc2626' : '#16a34a'}
                        strokeWidth={highlightedDim === 'length' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="150" y="165" width="50" height="20" fill="#000000" rx="2" />
                      <text x="175" y="179" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        B: {formatVal(activeRow.length)}
                      </text>
                    </g>
                  </svg>
                )}

                {/* 400GSM WORKWEAR PANTS SCHEMATIC */}
                {activeCategory === 'pants' && (
                  <svg viewBox="0 0 320 280" className="w-full h-full relative z-10">
                    {/* Pant Outline */}
                    <path
                      d="M 105,25 L 215,25 L 225,80 L 235,255 L 185,255 L 160,110 L 135,255 L 85,255 L 95,80 Z"
                      fill="#ffffff"
                      stroke="#000000"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    {/* Waistband Band */}
                    <rect x="105" y="25" width="110" height="15" fill="#e5e5e5" stroke="#000000" strokeWidth="2" />
                    {/* Double Knee Stitching */}
                    <rect x="94" y="130" width="34" height="45" fill="none" stroke="#777" strokeWidth="1.5" strokeDasharray="2 2" />
                    <rect x="192" y="130" width="34" height="45" fill="none" stroke="#777" strokeWidth="1.5" strokeDasharray="2 2" />

                    {/* [A] Waist Line */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHighlightedDim('waist')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('waist')}
                    >
                      <line
                        x1="105"
                        y1="16"
                        x2="215"
                        y2="16"
                        stroke={highlightedDim === 'waist' ? '#dc2626' : '#2563eb'}
                        strokeWidth={highlightedDim === 'waist' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="135" y="6" width="50" height="18" fill="#000000" rx="2" />
                      <text x="160" y="19" textAnchor="middle" fill="#fff500" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        A: {formatVal(activeRow.waist)}
                      </text>
                    </g>

                    {/* [B] Inseam Line */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHighlightedDim('inseam')}
                      onMouseLeave={() => setHighlightedDim(null)}
                      onClick={() => setHighlightedDim('inseam')}
                    >
                      <line
                        x1="160"
                        y1="110"
                        x2="185"
                        y2="255"
                        stroke={highlightedDim === 'inseam' ? '#dc2626' : '#16a34a'}
                        strokeWidth={highlightedDim === 'inseam' ? '3.5' : '2'}
                        strokeDasharray="4 3"
                      />
                      <rect x="155" y="165" width="50" height="20" fill="#000000" rx="2" />
                      <text x="180" y="179" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        B: {formatVal(activeRow.inseam)}
                      </text>
                    </g>
                  </svg>
                )}
              </div>

              {/* Active Dimension Measurement Guide Text */}
              <div className="w-full mt-2 p-2 bg-[#fbf9f3] border border-black text-left">
                {highlightedDim && dimensionGuides[highlightedDim] ? (
                  <div>
                    <span className="font-mono-tag font-bold text-[9px] text-red-600 block">
                      {dimensionGuides[highlightedDim].tag}: {dimensionGuides[highlightedDim].label}
                    </span>
                    <p className="font-typewriter text-[10px] text-neutral-800 leading-tight mt-0.5">
                      {dimensionGuides[highlightedDim].how}
                    </p>
                  </div>
                ) : (
                  <p className="font-typewriter text-[10px] text-neutral-600 italic">
                    💡 Tip: Hover or click dimension lines [A], [B], [C] or table columns to see exact measuring technique.
                  </p>
                )}
              </div>
            </div>

            {/* Right 7 Cols: Sizing Table & Fit Recommender */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Measurement Matrix Table */}
              <div className="bg-white border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
                <div className="bg-black text-white px-3 py-1.5 flex items-center justify-between">
                  <span className="font-headline font-black text-xs uppercase tracking-wider text-yellow-300">
                    ARCHIVE SIZE MATRIX ({unit.toUpperCase()})
                  </span>
                  <span className="font-mono text-[9px] text-neutral-300">
                    CLICK A ROW TO SELECT
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b-2 border-black font-bold text-[10px] text-black uppercase">
                        <th className="p-2 border-r border-neutral-300">SIZE</th>
                        {activeCategory !== 'pants' ? (
                          <>
                            <th
                              onMouseEnter={() => setHighlightedDim('chest')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 border-r border-neutral-300 cursor-pointer ${
                                highlightedDim === 'chest' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              CHEST [A]
                            </th>
                            <th
                              onMouseEnter={() => setHighlightedDim('length')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 border-r border-neutral-300 cursor-pointer ${
                                highlightedDim === 'length' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              LENGTH [B]
                            </th>
                            <th
                              onMouseEnter={() => setHighlightedDim('shoulder')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 border-r border-neutral-300 cursor-pointer ${
                                highlightedDim === 'shoulder' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              SHOULDER [C]
                            </th>
                            <th
                              onMouseEnter={() => setHighlightedDim('sleeve')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 cursor-pointer ${
                                highlightedDim === 'sleeve' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              SLEEVE [D]
                            </th>
                          </>
                        ) : (
                          <>
                            <th
                              onMouseEnter={() => setHighlightedDim('waist')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 border-r border-neutral-300 cursor-pointer ${
                                highlightedDim === 'waist' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              WAIST [A]
                            </th>
                            <th
                              onMouseEnter={() => setHighlightedDim('inseam')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 border-r border-neutral-300 cursor-pointer ${
                                highlightedDim === 'inseam' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              INSEAM [B]
                            </th>
                            <th
                              onMouseEnter={() => setHighlightedDim('rise')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 border-r border-neutral-300 cursor-pointer ${
                                highlightedDim === 'rise' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              RISE [C]
                            </th>
                            <th
                              onMouseEnter={() => setHighlightedDim('legOpening')}
                              onMouseLeave={() => setHighlightedDim(null)}
                              className={`p-2 cursor-pointer ${
                                highlightedDim === 'legOpening' ? 'bg-yellow-200' : ''
                              }`}
                            >
                              LEG OPEN [D]
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const isSelected = row.size === activeSize;
                        const isRecommended = row.size === recommendedSize;

                        return (
                          <tr
                            key={row.size}
                            onClick={() => setActiveSize(row.size)}
                            className={`border-b border-neutral-200 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-black text-white font-bold'
                                : isRecommended
                                ? 'bg-yellow-100/70 hover:bg-yellow-200'
                                : 'hover:bg-neutral-100'
                            }`}
                          >
                            <td className="p-2 border-r border-neutral-300 font-headline font-black text-xs flex items-center gap-1.5">
                              <span>{row.size}</span>
                              {isRecommended && (
                                <span
                                  className={`text-[8px] px-1 py-0.2 uppercase font-mono font-bold ${
                                    isSelected ? 'bg-yellow-300 text-black' : 'bg-red-600 text-white'
                                  }`}
                                >
                                  FIT REC
                                </span>
                              )}
                            </td>
                            {activeCategory !== 'pants' ? (
                              <>
                                <td className="p-2 border-r border-neutral-300">{formatVal(row.chest)}</td>
                                <td className="p-2 border-r border-neutral-300">{formatVal(row.length)}</td>
                                <td className="p-2 border-r border-neutral-300">{formatVal(row.shoulder)}</td>
                                <td className="p-2">{formatVal(row.sleeve)}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-2 border-r border-neutral-300">{formatVal(row.waist)}</td>
                                <td className="p-2 border-r border-neutral-300">{formatVal(row.inseam)}</td>
                                <td className="p-2 border-r border-neutral-300">{formatVal(row.rise)}</td>
                                <td className="p-2">{formatVal(row.legOpening)}</td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Size Recommender / Fit Finder Widget */}
              <div className="bg-[#f7f5ed] border-2 border-black p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-black/30 pb-1">
                  <span className="font-headline font-black text-xs uppercase flex items-center gap-1 text-black">
                    <span>⚡</span>
                    <span>QUICK FIT RECOMMENDER</span>
                  </span>
                  <span className="font-mono-tag text-[9px] text-neutral-600">
                    REC: <strong className="text-black bg-yellow-300 px-1 border border-black font-black">{recommendedSize}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-tag">
                  {/* Height */}
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-600 uppercase mb-0.5">
                      YOUR HEIGHT:
                    </label>
                    <select
                      value={userHeight}
                      onChange={(e) => setUserHeight(e.target.value as any)}
                      className="w-full bg-white border border-black p-1 text-[11px] font-bold cursor-pointer"
                    >
                      <option value="short">&lt; 5'7" (&lt; 172 cm)</option>
                      <option value="regular">5'8" - 5'11" (173 - 180 cm)</option>
                      <option value="tall">6'0" - 6'2" (182 - 188 cm)</option>
                      <option value="very-tall">&gt; 6'3" (&gt; 190 cm)</option>
                    </select>
                  </div>

                  {/* Preferred Silhouette Drape */}
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-600 uppercase mb-0.5">
                      INTENDED DRAPE:
                    </label>
                    <select
                      value={userFitPreference}
                      onChange={(e) => setUserFitPreference(e.target.value as any)}
                      className="w-full bg-white border border-black p-1 text-[11px] font-bold cursor-pointer"
                    >
                      <option value="true-boxy">True Boxy (Intended Cut)</option>
                      <option value="fitted">More Tailored / Slim</option>
                      <option value="oversized">Heavy Oversized Slouch</option>
                    </select>
                  </div>
                </div>

                <p className="font-typewriter text-[10px] text-neutral-700 leading-tight">
                  {activeCategory === 'hoodies'
                    ? 'Our 500GSM hoodies feature a structured box cut with wide armholes. True to size hits precisely above the hip.'
                    : activeCategory === 'tees'
                    ? 'Our 300GSM tees are pre-shrunk with a stiff drop-shoulder. Stay true to size for signature Tokyo/London drape.'
                    : 'Our workwear pants sit mid-rise with extra room through the thigh and slight skate taper.'}
                </p>
              </div>

              {/* Apply Size Back to Product CTA */}
              {onSelectSize && (
                <button
                  id="applySizeBtn"
                  onClick={() => {
                    onSelectSize(activeSize);
                    onClose();
                  }}
                  className="w-full bg-black text-[#fff500] hover:bg-neutral-900 border-2 border-black py-2.5 px-4 font-headline font-black text-sm uppercase shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✓</span>
                  <span>APPLY SIZE [{activeSize}] TO GARMENT</span>
                </button>
              )}

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] font-mono-tag">
          <span className="text-neutral-600 font-typewriter">
            Heavyweight textiles undergo zero wash shrinkage due to high-temperature silicone preshrink treatment.
          </span>
          <button
            onClick={onClose}
            className="text-black font-bold uppercase underline hover:text-red-600 cursor-pointer"
          >
            [CLOSE SIZE SCHEMATIC]
          </button>
        </div>

      </div>
    </div>
  );
};
