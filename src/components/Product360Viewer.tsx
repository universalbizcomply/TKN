import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProductItem, ProductAngle } from '../types';
import { GarmentGraphic } from './GarmentGraphic';
import { playTurntableTick, playPaperRustle } from '../utils/audio';

interface Product360ViewerProps {
  product: ProductItem;
  initialAngleIndex?: number;
  onAngleChange?: (index: number) => void;
  onExit360?: () => void;
}

export const Product360Viewer: React.FC<Product360ViewerProps> = ({
  product,
  initialAngleIndex = 0,
  onAngleChange,
  onExit360,
}) => {
  const numFrames = Math.max(1, product.angles.length);
  const slice = 360 / numFrames;

  // Initialize rotation degrees to align with initialAngleIndex
  const [rotationDeg, setRotationDeg] = useState<number>(initialAngleIndex * slice);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [spinDirection, setSpinDirection] = useState<1 | -1>(1);
  const [hasInteracted, setHasInteracted] = useState(false);

  // References for drag handling
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef<number>(0);
  const dragStartDegRef = useRef<number>(0);
  const lastFrameIndexRef = useRef<number>(initialAngleIndex);
  const animFrameRef = useRef<number | null>(null);

  // Normalized continuous degree between 0 and 359.99
  const normalizedDeg = ((rotationDeg % 360) + 360) % 360;

  // Calculate current active frame from rotation angle
  // Offset by half a slice so frame 0 is centered around 0° (e.g., -45° to +45° for 4 frames)
  const activeFrameIndex = Math.floor(((normalizedDeg + slice / 2) % 360) / slice);
  const currentAngle: ProductAngle = product.angles[activeFrameIndex] || product.angles[0];

  // Sound effect & parent sync on frame change
  useEffect(() => {
    if (activeFrameIndex !== lastFrameIndexRef.current) {
      lastFrameIndexRef.current = activeFrameIndex;
      playTurntableTick();
      if (onAngleChange) {
        onAngleChange(activeFrameIndex);
      }
    }
  }, [activeFrameIndex, onAngleChange]);

  // Auto-Spin Animation Loop
  useEffect(() => {
    if (!isAutoSpinning || isDragging) return;

    const speedFactors = {
      slow: 0.25,
      normal: 0.65,
      fast: 1.35,
    };
    const speed = speedFactors[spinSpeed] * spinDirection;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 16.66; // normalize to 60fps
      lastTime = currentTime;

      setRotationDeg((prev) => (prev + speed * delta) % 360);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isAutoSpinning, isDragging, spinSpeed, spinDirection]);

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    setIsDragging(true);
    setHasInteracted(true);
    dragStartXRef.current = e.clientX;
    dragStartDegRef.current = rotationDeg;

    // Capture pointer
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  // Pointer drag move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartXRef.current;
    // Sensitivity: 1.5 pixels = 1 degree of rotation
    const degDelta = deltaX * 0.75;
    const newDeg = (dragStartDegRef.current + degDelta) % 360;

    setRotationDeg(newDeg);
  };

  // Pointer drag end
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Snap to preset degree angle
  const handleJumpToPreset = (targetDeg: number) => {
    setHasInteracted(true);
    playPaperRustle();
    setRotationDeg(targetDeg);
  };

  // Toggle Auto-spin
  const handleToggleAutoSpin = () => {
    setHasInteracted(true);
    setIsAutoSpinning((prev) => !prev);
  };

  // Degree keyframe presets
  const presets = [
    { label: '0° FRONT', deg: 0, sub: 'MAIN ANGLE' },
    { label: '90° RIGHT', deg: 90, sub: 'PROFILE ALT' },
    { label: '180° REAR', deg: 180, sub: 'BACK ARCHIVE' },
    { label: '270° LEFT', deg: 270, sub: 'FIT DRAPE' },
  ];

  // Calculate subtle yaw offset for 3D realism
  const subAngleOffset = (((normalizedDeg - activeFrameIndex * slice + 180) % 360) + 360) % 360 - 180;
  const yawTilt = Math.max(-24, Math.min(24, subAngleOffset * 0.45));

  return (
    <div className="w-full flex flex-col items-center select-none" id="product360Viewer">
      
      {/* 360 Interactive Turntable Viewport */}
      <div className="w-full max-w-md bg-white border-2 border-black p-3 pb-4 polaroid-drop-shadow relative">
        
        {/* Serrated Tape swatch on polaroid */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 masking-tape-yellow serrated-tape z-20 opacity-95 shadow flex items-center justify-center">
          <span className="text-[9px] font-mono-tag font-bold tracking-widest text-black/80">
            360° ARCHIVE SCAN
          </span>
        </div>

        {/* Viewport Box */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full aspect-square ${currentAngle.bgClass} border-2 border-black overflow-hidden flex flex-col justify-between p-2.5 touch-none transition-colors ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          title="Drag horizontally to rotate 360 degrees"
        >
          {/* Top Status Bar & Angle Compass Readout */}
          <div className="flex items-center justify-between z-20 pointer-events-none">
            
            {/* Real-time Rotation Degrees Badge */}
            <div className="flex items-center gap-1.5 bg-black/90 border border-[#feef89] px-2 py-0.5 shadow-xs">
              <span className={`w-2 h-2 rounded-full ${isAutoSpinning ? 'bg-emerald-400 animate-ping' : 'bg-[#feef89]'}`} />
              <span className="font-mono-tag font-black text-xs text-[#feef89] tracking-wider">
                {Math.round(normalizedDeg)}°
              </span>
              <span className="font-mono-tag text-[9px] text-neutral-300">
                / 360°
              </span>
            </div>

            {/* Frame Sequence Step Badge */}
            <div className="flex items-center gap-1 bg-black/90 border border-white/30 px-2 py-0.5">
              <span className="font-mono-tag text-[10px] text-white font-bold uppercase">
                FRAME {activeFrameIndex + 1}/{numFrames}
              </span>
              <span className="bg-yellow-400 text-black text-[9px] font-mono-tag font-black px-1">
                360°
              </span>
            </div>
          </div>

          {/* Garment Graphic in 3D Turntable Perspective */}
          <div className="absolute inset-0 flex items-center justify-center p-6 overflow-hidden pointer-events-none">
            
            {/* Turntable Pedestal Base Graphic */}
            <div className="absolute bottom-6 w-56 h-12 flex items-center justify-center -z-0 pointer-events-none">
              <svg viewBox="0 0 200 40" className="w-full h-full opacity-60">
                <ellipse cx="100" cy="20" rx="90" ry="15" fill="#141416" stroke="#555555" strokeWidth="1.5" />
                <ellipse cx="100" cy="20" rx="75" ry="11" fill="none" stroke="#feef89" strokeWidth="0.8" strokeDasharray="3 3" />
                {/* Rotating angle ticks on turntable */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const tickAngle = (i * 30 + normalizedDeg) * (Math.PI / 180);
                  const tx1 = 100 + Math.cos(tickAngle) * 80;
                  const ty1 = 20 + Math.sin(tickAngle) * 13;
                  const tx2 = 100 + Math.cos(tickAngle) * 88;
                  const ty2 = 20 + Math.sin(tickAngle) * 14.5;
                  return (
                    <line
                      key={i}
                      x1={tx1}
                      y1={ty1}
                      x2={tx2}
                      y2={ty2}
                      stroke={i % 3 === 0 ? '#feef89' : '#888888'}
                      strokeWidth={i % 3 === 0 ? 1.5 : 1}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Dynamic Ambient Turntable Specular Sheen */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${40 + Math.sin((normalizedDeg * Math.PI) / 180) * 35}% ${
                  45 + Math.cos((normalizedDeg * Math.PI) / 180) * 15
                }%, rgba(254, 239, 137, 0.45) 0%, transparent 60%)`,
              }}
            />

            {/* Garment Visual with dynamic yaw rotation */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `perspective(750px) rotateY(${yawTilt}deg)`,
              }}
            >
              <GarmentGraphic angle={currentAngle} />
            </div>

            {/* Turntable Shadow beneath the garment */}
            <div
              className="absolute bottom-5 w-40 h-4 bg-black/50 rounded-full blur-xs pointer-events-none transition-transform duration-100"
              style={{
                transform: `scale(${0.9 + Math.abs(yawTilt) * 0.005}) translateX(${yawTilt * 0.4}px)`,
              }}
            />
          </div>

          {/* Interactive Drag Hint Overlay (Auto-dims on interaction) */}
          <div
            className={`z-20 mt-auto pt-2 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${
              isDragging ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <div className="bg-black/85 border border-[#feef89] px-2.5 py-1 text-center shadow-xs flex items-center gap-2">
              <span className="text-[#feef89] text-[10px] animate-pulse">⟵</span>
              <span className="font-mono-tag font-bold text-[10px] text-white uppercase tracking-wider">
                {isDragging ? 'ROTATING TURNTABLE' : 'DRAG TO ROTATE 360°'}
              </span>
              <span className="text-[#feef89] text-[10px] animate-pulse">⟶</span>
            </div>

            {/* Current Active Angle Label */}
            <div className="mt-1">
              <span className="font-marker text-xs text-[#fff500] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center line-clamp-1">
                {currentAngle.label}
              </span>
            </div>
          </div>
        </div>

        {/* Polaroid Card Caption */}
        <div className="mt-2 text-center">
          <div className="flex items-center justify-between text-left">
            <div>
              <h3 className="font-headline font-black text-sm sm:text-base text-black uppercase tracking-tight">
                {product.title}
              </h3>
              <p className="font-typewriter text-[11px] text-neutral-600 line-clamp-1">
                {currentAngle.sublabel}
              </p>
            </div>

            {onExit360 && (
              <button
                id="exit360ToZoomBtn"
                onClick={onExit360}
                className="bg-[#fbf9f3] hover:bg-yellow-200 border border-black px-2 py-1 text-[10px] font-mono-tag font-bold uppercase shadow-xs active:translate-y-0.5 transition-colors"
                title="Switch back to high-res still zoom lens"
              >
                🔍 STILL ZOOM
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 360° TURNTABLE CONTROLS DECK */}
      <div className="w-full max-w-md mt-3 bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_#000000] space-y-2.5">
        
        {/* Scrubber & Degree Gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono-tag font-bold text-neutral-800">
            <span className="flex items-center gap-1">
              <span>🔄</span>
              <span>SCRUB ANGLE:</span>
            </span>
            <span className="bg-black text-[#fff500] px-1.5 py-0.2">
              {Math.round(normalizedDeg)}° DEG
            </span>
          </div>

          {/* Interactive Range Scrubber */}
          <div className="relative flex items-center">
            <input
              id="rotationRangeScrubber"
              type="range"
              min="0"
              max="359"
              step="1"
              value={Math.round(normalizedDeg)}
              onChange={(e) => {
                setHasInteracted(true);
                setRotationDeg(Number(e.target.value));
              }}
              className="w-full h-2 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black border border-black"
            />
          </div>

          {/* Keyframe tick marks */}
          <div className="flex justify-between px-1 text-[8px] font-mono-tag text-neutral-500">
            <span>0° (FRONT)</span>
            <span>90° (RIGHT)</span>
            <span>180° (REAR)</span>
            <span>270° (LEFT)</span>
            <span>360°</span>
          </div>
        </div>

        {/* Quick Angle Jump Buttons */}
        <div className="grid grid-cols-4 gap-1">
          {presets.map((p, pIdx) => {
            const isPresetActive = Math.abs(((normalizedDeg - p.deg + 180 + 360) % 360) - 180) < slice / 2;
            return (
              <button
                key={pIdx}
                id={`presetAngleBtn_${p.deg}`}
                onClick={() => handleJumpToPreset(p.deg)}
                className={`py-1 px-0.5 border text-center transition-all ${
                  isPresetActive
                    ? 'bg-black text-[#feef89] border-black font-bold shadow-xs scale-102'
                    : 'bg-[#fbf9f3] text-neutral-800 border-neutral-400 hover:border-black font-medium'
                }`}
              >
                <div className="font-mono-tag text-[9px] leading-tight">{p.label}</div>
              </button>
            );
          })}
        </div>

        {/* Auto-Spin & Speed Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/15">
          
          {/* Auto Spin Toggle */}
          <button
            id="toggleAutoSpinBtn"
            onClick={handleToggleAutoSpin}
            className={`flex-1 py-1.5 px-2 border-2 border-black font-mono-tag text-[10px] sm:text-xs font-bold uppercase shadow-[2px_2px_0px_#000] active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-colors ${
              isAutoSpinning
                ? 'bg-yellow-300 text-black'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            <span>{isAutoSpinning ? '⏸' : '▶'}</span>
            <span>{isAutoSpinning ? 'PAUSE TURNTABLE' : 'AUTO SPIN 360°'}</span>
          </button>

          {/* Direction Reverse Toggle */}
          <button
            id="toggleSpinDirectionBtn"
            onClick={() => {
              setHasInteracted(true);
              setSpinDirection((prev) => (prev === 1 ? -1 : 1));
            }}
            className="bg-[#fbf9f3] hover:bg-neutral-100 border border-black px-2 py-1.5 font-mono-tag text-[10px] font-bold shadow-xs"
            title="Toggle Spin Direction (Clockwise / Counter-Clockwise)"
          >
            {spinDirection === 1 ? '↻ CW' : '↺ CCW'}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center border border-black bg-neutral-100 p-0.5">
            {(['slow', 'normal', 'fast'] as const).map((spd) => (
              <button
                key={spd}
                id={`speedBtn_${spd}`}
                onClick={() => {
                  setHasInteracted(true);
                  setSpinSpeed(spd);
                }}
                className={`text-[9px] font-mono-tag px-1.5 py-0.5 uppercase transition-colors ${
                  spinSpeed === spd
                    ? 'bg-black text-[#feef89] font-bold'
                    : 'text-neutral-700 hover:text-black'
                }`}
              >
                {spd === 'slow' ? '0.5X' : spd === 'normal' ? '1X' : '2X'}
              </button>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
