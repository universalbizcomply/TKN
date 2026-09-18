import React from 'react';
import { ProductAngle } from '../types';

interface GarmentGraphicProps {
  angle: ProductAngle;
  variant?: string;
  isZoomed?: boolean;
}

export const GarmentGraphic: React.FC<GarmentGraphicProps> = ({ angle, variant, isZoomed = false }) => {
  const v = variant || angle.svgVariant || '';

  // Lookbook Skater Stick Figure (Exact match from screenshot)
  if (angle.type === 'lookbook' || v === 'lookbook-skater') {
    return (
      <svg
        viewBox="0 0 200 240"
        className={`w-full h-full object-contain ${isZoomed ? 'scale-125 transition-transform duration-300' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground shadow doodle */}
        <ellipse cx="100" cy="225" rx="35" ry="6" fill="#111111" opacity="0.15" />

        {/* Head with backwards cap */}
        <circle cx="100" cy="45" r="14" fill="#111111" />
        {/* Cap visor */}
        <path d="M90 40 L65 37 L75 46 Z" fill="#111111" />
        
        {/* Neck line */}
        <path d="M100 59 L100 70" stroke="#111111" strokeWidth="4" strokeLinecap="round" />

        {/* Oversized Boxy Hoodie Body */}
        <path
          d="M68 72 L132 72 L124 135 L76 135 Z"
          fill="#1c1b1b"
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Kangaroo pocket line */}
        <path
          d="M84 112 L116 112 L112 135 L88 135 Z"
          stroke="#383838"
          strokeWidth="2.5"
          fill="#252424"
        />

        {/* Drop shoulder sleeves / stick arms holding skate deck or chill posture */}
        {/* Left arm */}
        <path
          d="M68 76 L48 108 L62 120"
          stroke="#111111"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right arm */}
        <path
          d="M132 76 L152 108 L138 120"
          stroke="#111111"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hands / mittens */}
        <circle cx="62" cy="120" r="5" fill="#111111" />
        <circle cx="138" cy="120" r="5" fill="#111111" />

        {/* Baggy Skate Pants (Wide legs) */}
        {/* Left leg */}
        <path
          d="M80 135 L68 200 L90 200 L95 145"
          fill="#282828"
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Right leg */}
        <path
          d="M105 145 L110 200 L132 200 L120 135"
          fill="#282828"
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Chunky skate shoes */}
        {/* Left shoe */}
        <path
          d="M60 205 C60 198, 70 198, 92 198 L92 212 L58 212 Z"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="3"
        />
        <path d="M58 209 L92 209" stroke="#111111" strokeWidth="2" />

        {/* Right shoe */}
        <path
          d="M108 198 C130 198, 140 198, 140 205 L142 212 L108 212 Z"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="3"
        />
        <path d="M108 209 L142 209" stroke="#111111" strokeWidth="2" />
      </svg>
    );
  }

  // Lookbook Detail #02
  if (v === 'lookbook-detail') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-32 h-44 border-2 border-dashed border-[#111] p-3 flex flex-col justify-between bg-white/70">
          <div className="text-[10px] font-mono-tag tracking-wider text-left">ARCHIVE // FIT 02</div>
          <div className="flex flex-col items-center my-auto">
            <span className="font-headline font-bold text-2xl tracking-tighter">OVR.SIZED</span>
            <span className="font-typewriter text-xs text-neutral-600 mt-1">300GSM + 500GSM</span>
          </div>
          <div className="text-[9px] font-mono-tag text-right">FIG. A-26</div>
        </div>
      </div>
    );
  }

  // Pants (Skate Pant / Duck Canvas)
  if (angle.type === 'pants' || v === 'duck-canvas') {
    return (
      <svg
        viewBox="0 0 160 200"
        className={`w-3/5 h-4/5 object-contain ${isZoomed ? 'scale-125 transition-transform duration-300' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Waistband */}
        <rect x="42" y="24" width="76" height="12" rx="1" fill="#28282a" stroke="#ffffff" strokeWidth="2.5" />
        {/* Fly & belt loops */}
        <path d="M80 24 L80 62" stroke="#ffffff" strokeWidth="2" />
        <path d="M72 62 C72 68, 80 68, 80 62" stroke="#ffffff" strokeWidth="2" />
        <line x1="56" y1="24" x2="56" y2="36" stroke="#ffffff" strokeWidth="2" />
        <line x1="104" y1="24" x2="104" y2="36" stroke="#ffffff" strokeWidth="2" />

        {/* Outer Pants Silhouette */}
        <path
          d="M44 36 L30 178 L68 178 L79 72 L90 178 L128 178 L114 36 Z"
          fill="#1c1c1e"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Double Knee Panel Stitching */}
        <rect x="36" y="90" width="28" height="46" rx="1" fill="none" stroke="#ffffff" strokeWidth="1.75" strokeDasharray="3 2" />
        <rect x="94" y="90" width="28" height="46" rx="1" fill="none" stroke="#ffffff" strokeWidth="1.75" strokeDasharray="3 2" />

        {/* Hammer loop & side tool pocket */}
        <path d="M120 86 L128 86 L128 114 L118 114" stroke="#ffffff" strokeWidth="1.75" />
      </svg>
    );
  }

  // Pants Knee Detail Zoom
  if (v === 'pants-detail') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-48 h-48 border-2 border-[#ffffff]/60 bg-[#151517] p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Diagonal heavy canvas twill lines */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(45deg,#fff,#fff_1px,transparent_1px,transparent_4px)]" />
          <div className="flex justify-between items-center z-10">
            <span className="text-[10px] font-mono-tag text-yellow-300">14OZ DUCK CANVAS</span>
            <span className="text-[10px] font-mono-tag text-white/70">TRIPLE STITCH</span>
          </div>
          {/* Rivet & Stitch Lines */}
          <div className="my-auto z-10 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-[#c29653] border border-black flex items-center justify-center shadow-inner">
                <div className="w-1 h-1 rounded-full bg-black/60" />
              </div>
              <div className="h-0.5 flex-1 border-b-2 border-dashed border-white/80" />
            </div>
            <div className="text-[11px] font-typewriter text-neutral-300 pl-6">
              REINFORCED KNEE CORNER
            </div>
          </div>
          <div className="text-[9px] font-mono-tag text-neutral-400 z-10">
            BAR-TACK SPEC: 42 STITCHES
          </div>
        </div>
      </div>
    );
  }

  // Hoodie (500GSM Hoodie / Charcoal)
  if (angle.type === 'hoodie' && v !== 'hoodie-weave') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={`w-4/5 h-4/5 object-contain ${isZoomed ? 'scale-125 transition-transform duration-300' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Double Layer Stiff Hood */}
        <path
          d="M78 48 C78 28, 88 18, 100 18 C112 18, 122 28, 122 48 C114 54, 86 54, 78 48 Z"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Hood overlap opening */}
        <path d="M92 42 L100 52 L108 42" stroke="#1c1b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Drop shoulder body */}
        <path
          d="M74 46 L38 78 L52 98 L72 82 L72 165 L128 165 L128 82 L148 98 L162 78 L126 46 Z"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Kangaroo Pocket */}
        <path
          d="M82 122 L118 122 L112 152 L88 152 Z"
          fill="#e4e4e4"
          stroke="#1c1b1b"
          strokeWidth="2"
        />

        {/* Ribbed Hem & Cuffs */}
        <rect x="72" y="155" width="56" height="10" fill="#dedede" stroke="#1c1b1b" strokeWidth="1.5" />
        <path d="M40 85 L48 96" stroke="#1c1b1b" strokeWidth="1.5" />
        <path d="M158 85 L150 96" stroke="#1c1b1b" strokeWidth="1.5" />
      </svg>
    );
  }

  // Hoodie Weave Texture Macro Zoom
  if (v === 'hoodie-weave') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-44 h-44 rounded-full border-4 border-yellow-300/80 bg-[#1c1d21] p-4 flex flex-col justify-center items-center relative overflow-hidden shadow-2xl">
          {/* French Terry Loopback pattern */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:8px_8px]" />
          <div className="z-10 text-center">
            <span className="font-headline font-black text-2xl text-white tracking-wider block">500 GSM</span>
            <span className="text-[10px] font-mono-tag text-yellow-300 tracking-widest uppercase">FRENCH TERRY</span>
            <div className="mt-2 text-[9px] font-typewriter text-neutral-300">
              UNBRUSHED LOOPBACK<br />ZERO PILLING RESISTANCE
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Crewneck (Raw Edge Crew / Heather Grey)
  if (angle.type === 'crew' && v !== 'crew-detail') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={`w-4/5 h-4/5 object-contain ${isZoomed ? 'scale-125 transition-transform duration-300' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ribbed Crewneck Collar */}
        <ellipse cx="100" cy="46" rx="20" ry="9" fill="#e8e8e8" stroke="#111111" strokeWidth="2.5" />

        {/* Crew Body with drop shoulders */}
        <path
          d="M80 46 L38 80 L52 98 L72 82 L72 165 L128 165 L128 82 L148 98 L162 80 L120 46 Z"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Raw rolled hem doodle */}
        <path
          d="M72 165 C85 168, 115 162, 128 165"
          stroke="#111111"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />
        {/* V-stitch inset under collar */}
        <path d="M93 54 L100 64 L107 54" stroke="#111111" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  // Crew Detail Zoom
  if (v === 'crew-detail') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-44 h-44 border-2 border-white/80 bg-[#42464a] p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono-tag text-yellow-300">RAW CUT HEM // STUDY</div>
          <div className="border-b-2 border-dashed border-white/60 my-auto py-2">
            <span className="font-typewriter text-xs text-white block">DOUBLE FLATLOCK SEAM</span>
            <span className="text-[9px] font-mono-tag text-neutral-300">3-NEEDLE CHAINSTITCH</span>
          </div>
          <div className="text-[9px] font-mono-tag text-white/80">440 GSM LOOPBACK</div>
        </div>
      </div>
    );
  }

  // Thermal (Waffle Thermal / Bone White)
  if (angle.type === 'thermal' && v !== 'thermal-weave') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={`w-4/5 h-4/5 object-contain ${isZoomed ? 'scale-125 transition-transform duration-300' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark Long Sleeve Silhouette with Waffle styling */}
        <ellipse cx="100" cy="46" rx="18" ry="8" fill="#111111" stroke="#2b2b2b" strokeWidth="2" />
        <path
          d="M82 46 L30 110 L44 122 L68 94 L68 170 L132 170 L132 94 L156 122 L170 110 L118 46 Z"
          fill="#1c1b19"
          stroke="#111111"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Extended waffle cuffs */}
        <rect x="28" y="106" width="16" height="18" transform="rotate(38 28 106)" fill="#2a2927" stroke="#ffffff" strokeWidth="1" />
        <rect x="156" y="118" width="16" height="18" transform="rotate(-38 156 118)" fill="#2a2927" stroke="#ffffff" strokeWidth="1" />
      </svg>
    );
  }

  // Thermal Weave Zoom
  if (v === 'thermal-weave') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-44 h-44 border-2 border-neutral-900 bg-[#c5bea9] p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Honeycomb grid simulation */}
          <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(0deg,#000,#000_1px,transparent_1px,transparent_8px),repeating-linear-gradient(90deg,#000,#000_1px,transparent_1px,transparent_8px)]" />
          <span className="text-[10px] font-mono-tag font-bold text-neutral-900 z-10">HONEYCOMB KNIT</span>
          <div className="z-10 bg-black text-white px-2 py-1 text-center font-typewriter text-xs">
            380 GSM WAFFLE
          </div>
          <span className="text-[9px] font-mono-tag text-neutral-800 z-10">THERMAL RETENTION: MAX</span>
        </div>
      </div>
    );
  }

  // Back Print Archive Stamp
  if (v === 'back-print') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-40 h-48 border-2 border-[#f5f3ed] p-3 flex flex-col justify-between bg-[#151515] relative">
          <div className="text-[8px] font-mono-tag text-[#ff3b30] uppercase tracking-widest">CHAOS ARCHIVE</div>
          <div className="my-auto text-center border-y border-neutral-700 py-3">
            <span className="font-marker text-2xl text-yellow-300 block transform -rotate-2">CHAOS CLUB</span>
            <span className="font-headline font-bold text-xs text-white tracking-widest uppercase block mt-1">HEAVY COTTON</span>
            <span className="text-[8px] font-mono-tag text-neutral-400">SERIES 2026 // NO COMPROMISE</span>
          </div>
          <div className="text-[8px] font-mono-tag text-right text-neutral-400">100% DIY</div>
        </div>
      </div>
    );
  }

  // Default: Boxy T-Shirt (Exact match for Card 1 ACID BOX TEE)
  return (
    <svg
      viewBox="0 0 200 200"
      className={`w-4/5 h-4/5 object-contain ${isZoomed ? 'scale-125 transition-transform duration-300' : ''}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ribbed Collar */}
      <ellipse cx="100" cy="50" rx="19" ry="8" fill="#e5e5e5" stroke="#111111" strokeWidth="2.5" />
      
      {/* Boxy T-Shirt Body & Drop Short Sleeves */}
      <path
        d="M81 50 L42 76 L56 102 L72 90 L72 168 L128 168 L128 90 L144 102 L158 76 L119 50 Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Boxy fit crease lines */}
      <line x1="72" y1="92" x2="84" y2="108" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="128" y1="92" x2="116" y2="108" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
};
