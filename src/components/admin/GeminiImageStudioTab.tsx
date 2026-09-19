import React, { useState, useRef } from 'react';
import { api } from '../../lib/api';
import { ProductItem } from '../../types';
import {
  Image as ImageIcon,
  Wand2,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Maximize2,
  Layers,
  ArrowRight,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';

interface GeminiImageStudioTabProps {
  products?: ProductItem[];
}

interface ImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  mode: 'generate' | 'edit';
  aspectRatio: string;
  timestamp: string;
  sourceUrl?: string;
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', desc: 'Instagram / Feed' },
  { id: '3:4', label: '3:4 Portrait', desc: 'Lookbook / Editorial' },
  { id: '4:3', label: '4:3 Landscape', desc: 'Catalog Gallery' },
  { id: '16:9', label: '16:9 Wide', desc: 'Banner / Editorial' },
  { id: '9:16', label: '9:16 Reel', desc: 'TikTok / Story' },
];

const CREATE_PROMPT_PRESETS = [
  'Heavyweight washed black 500GSM oversized hoodie displayed on raw brutalist concrete wall, harsh London street flash photography, 35mm film grain.',
  'Studio macro flat-lay of 14oz duck canvas skate trousers showing reinforced knee rivets, brass YKK zipper, and thick chainstitched hem.',
  'Acid wash mineral grey boxy tee (300GSM) on hanger against London warehouse corrugated zinc background, industrial streetwear aesthetic.',
  'Editorial skate session photo at London Southbank underpass, model wearing 550GSM zip hoodie and relaxed carpenter pants, cinematic dusk.',
];

const EDIT_PROMPT_PRESETS = [
  'Add heavy vintage stone-wash distressing, faded seams, and authentic fabric fraying around the ribbed collar.',
  'Recolor the garment into washed army olive drab with subtle mineral discoloration on the kangaroo pocket.',
  'Add an authentic hand-pulled silkscreen back graphic with cracked white puff ink lettering saying "TO KNOW NOTHING // ARCHIVE".',
  'Transform the background into a gritty London Hackney industrial dye and screenprinting workshop with hanging squeegees.',
];

export const GeminiImageStudioTab: React.FC<GeminiImageStudioTabProps> = ({ products = [] }) => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>('1:1');

  // Source image for editing
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [sourcePreviewName, setSourcePreviewName] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [currentResult, setCurrentResult] = useState<ImageHistoryItem | null>(null);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default sample product image selection
  const handleSelectSampleGarment = (sampleProduct: ProductItem) => {
    // Generate an image representation or use standard lookbook placeholder
    setSourcePreviewName(`${sampleProduct.title} (${sampleProduct.gsm})`);
    
    // We can draw a synthetic sample canvas to produce clean base64 data
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(0, 0, 600, 600);
      // Streetwear grid texture
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 600; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(600, i);
        ctx.stroke();
      }
      // Text stamp
      ctx.fillStyle = '#fff500';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`TO KNOW NOTHING // ARCHIVE`, 40, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(sampleProduct.title, 40, 140);
      ctx.font = '22px monospace';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`SPEC: ${sampleProduct.gsm} • ${sampleProduct.fit || 'RELAXED'}`, 40, 180);
      
      // Silhouette box
      ctx.strokeStyle = '#fff500';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 230, 400, 310);
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(100, 230, 400, 310);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('[SOURCE GARMENT MOCKUP]', 160, 390);

      const b64 = canvas.toDataURL('image/png');
      setSourceImageBase64(b64);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid PNG, JPG, or WEBP image.');
      return;
    }

    setSourcePreviewName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImageBase64(event.target.result as string);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecute = async () => {
    if (!prompt.trim() || isLoading) return;

    if (mode === 'edit' && !sourceImageBase64) {
      setErrorMessage('Please upload or select an image to edit.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.geminiImage({
        prompt: prompt.trim(),
        mode,
        aspectRatio,
        sourceImageBase64: mode === 'edit' ? sourceImageBase64! : undefined,
      });

      if (res.success && res.imageUrl) {
        const newItem: ImageHistoryItem = {
          id: `img-${Date.now()}`,
          url: res.imageUrl,
          prompt: prompt.trim(),
          mode,
          aspectRatio,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sourceUrl: mode === 'edit' && sourceImageBase64 ? sourceImageBase64 : undefined,
        };

        setCurrentResult(newItem);
        setHistory((prev) => [newItem, ...prev]);
      } else {
        setErrorMessage(res.error || 'Failed to generate image. Please check API quota or prompt.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Image processing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (item: ImageHistoryItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `tkn-studio-${item.mode}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white border-2 border-black overflow-y-auto">
      {/* Studio Header Bar */}
      <div className="bg-[#f4f2ea] border-b-2 border-black p-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-black text-yellow-300">
            <Wand2 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-headline font-black text-sm uppercase text-black">
              GEMINI IMAGE STUDIO // CREATE & EDIT
            </h3>
            <p className="font-mono-tag text-[10px] text-neutral-600">
              Powered by <span className="font-bold text-black">gemini-3.1-flash-image-preview</span> • High-Fidelity Neural Image Generation
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 border-2 border-black bg-white p-0.5">
          <button
            onClick={() => setMode('generate')}
            className={`px-3 py-1 font-mono-tag text-xs font-bold uppercase transition-all cursor-pointer ${
              mode === 'generate'
                ? 'bg-black text-yellow-300'
                : 'text-neutral-700 hover:text-black'
            }`}
          >
            [1] CREATE NEW IMAGE
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-3 py-1 font-mono-tag text-xs font-bold uppercase transition-all cursor-pointer ${
              mode === 'edit'
                ? 'bg-black text-yellow-300'
                : 'text-neutral-700 hover:text-black'
            }`}
          >
            [2] EDIT EXISTING IMAGE
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 border-b-2 lg:border-b-0 lg:border-r-2 border-black p-4 space-y-4 overflow-y-auto bg-[#faf9f5]">
          {/* If Mode === 'edit', display Source Image Selection */}
          {mode === 'edit' && (
            <div className="border-2 border-black p-3 bg-white shadow-[2px_2px_0px_#000] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono-tag font-bold text-xs uppercase flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> SOURCE IMAGE TO EDIT
                </span>
                {sourceImageBase64 && (
                  <button
                    onClick={() => {
                      setSourceImageBase64(null);
                      setSourcePreviewName('');
                    }}
                    className="text-[10px] font-mono-tag text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>

              {sourceImageBase64 ? (
                <div className="relative border border-black bg-neutral-900 flex items-center justify-center p-2 max-h-48 overflow-hidden group">
                  <img
                    src={sourceImageBase64}
                    alt="Source preview"
                    className="max-h-44 object-contain"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/80 text-yellow-300 text-[10px] font-mono-tag px-2 py-0.5 truncate max-w-[85%]">
                    {sourcePreviewName || 'Loaded Image'}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-400 hover:border-black p-4 text-center cursor-pointer bg-neutral-50 hover:bg-yellow-50/40 transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto mb-1 text-neutral-500" />
                  <p className="font-mono-tag text-xs font-bold text-black">
                    CLICK TO UPLOAD IMAGE (PNG, JPG)
                  </p>
                  <p className="font-mono-tag text-[10px] text-neutral-500 mt-0.5">
                    Or select an archive garment below
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Quick sample garment selector */}
              {products.length > 0 && (
                <div>
                  <span className="font-mono-tag text-[10px] font-bold text-neutral-500 block mb-1">
                    OR PICK ARCHIVE CATALOG BLANK:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {products.slice(0, 4).map((prod) => (
                      <button
                        key={prod.id}
                        onClick={() => handleSelectSampleGarment(prod)}
                        className="text-[10px] font-mono-tag px-2 py-0.5 border border-black bg-neutral-100 hover:bg-black hover:text-yellow-300 transition-colors cursor-pointer"
                      >
                        {prod.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aspect Ratio Selector */}
          <div className="space-y-1.5">
            <label className="font-mono-tag text-xs font-bold uppercase text-black flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> ASPECT RATIO
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as any)}
                  className={`p-1.5 border-2 text-center transition-all cursor-pointer ${
                    aspectRatio === ar.id
                      ? 'border-black bg-black text-yellow-300 shadow-[1px_1px_0px_#000]'
                      : 'border-neutral-300 bg-white text-black hover:border-black'
                  }`}
                >
                  <div className="font-mono-tag font-bold text-xs">{ar.id}</div>
                  <div className="font-mono-tag text-[8px] truncate opacity-80">{ar.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="font-mono-tag text-xs font-bold uppercase text-black flex items-center justify-between">
              <span>{mode === 'generate' ? 'IMAGE GENERATION PROMPT' : 'IMAGE EDITING INSTRUCTION'}</span>
              <span className="text-[10px] font-normal text-neutral-500">Natural language text prompt</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder={
                mode === 'generate'
                  ? 'Describe the streetwear apparel, material textures (e.g. 500GSM loopback terry), setting, lighting, and camera angle...'
                  : 'Describe the modifications to make (e.g. "Add vintage stone wash distressing", "Change colorway to washed olive", "Add heavy silkscreen puff graphic")...'
              }
              className="w-full border-2 border-black p-2.5 text-xs font-mono-tag bg-white focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#000]"
            />
          </div>

          {/* Prompt Presets */}
          <div className="space-y-1">
            <span className="font-mono-tag text-[10px] font-bold text-neutral-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-black" /> QUICK STREETWEAR PROMPTS:
            </span>
            <div className="space-y-1">
              {(mode === 'generate' ? CREATE_PROMPT_PRESETS : EDIT_PROMPT_PRESETS).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="w-full text-left p-1.5 border border-neutral-300 bg-white hover:border-black hover:bg-yellow-50 text-[10px] font-mono-tag text-neutral-800 truncate transition-colors cursor-pointer"
                >
                  › {p}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 bg-red-100 border border-red-500 text-red-900 text-xs font-mono-tag flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            onClick={handleExecute}
            disabled={!prompt.trim() || isLoading || (mode === 'edit' && !sourceImageBase64)}
            className="w-full bg-black text-yellow-300 hover:bg-neutral-800 disabled:opacity-50 font-mono-tag font-bold text-xs uppercase py-3 border-2 border-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] active:translate-y-0.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
                <span>PROCESSING WITH GEMINI-3.1-FLASH-IMAGE...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-yellow-300" />
                <span>
                  {mode === 'generate'
                    ? 'GENERATE IMAGE FROM TEXT PROMPT'
                    : 'EXECUTE IMAGE EDIT WITH TEXT PROMPT'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Visual Stage & Results (7 cols) */}
        <div className="lg:col-span-7 p-4 flex flex-col justify-between overflow-y-auto bg-neutral-100">
          {currentResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <span className="bg-black text-yellow-300 text-[10px] font-mono-tag font-bold px-2 py-0.5 uppercase mr-2">
                    {currentResult.mode.toUpperCase()} OUTPUT
                  </span>
                  <span className="font-mono-tag text-xs font-bold text-black">
                    ASPECT RATIO: {currentResult.aspectRatio}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(currentResult)}
                    className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 text-xs font-mono-tag font-bold border border-black flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> DOWNLOAD PNG
                  </button>
                </div>
              </div>

              {/* Main Image Display (with Side-by-Side if Edit Mode) */}
              {currentResult.mode === 'edit' && currentResult.sourceUrl ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-black bg-white p-2 text-center shadow-[2px_2px_0px_#000]">
                    <span className="font-mono-tag text-[10px] font-bold text-neutral-500 block mb-1">
                      [BEFORE] ORIGINAL
                    </span>
                    <img
                      src={currentResult.sourceUrl}
                      alt="Before edit"
                      className="w-full max-h-[360px] object-contain mx-auto"
                    />
                  </div>

                  <div className="border-2 border-black bg-white p-2 text-center shadow-[2px_2px_0px_#000]">
                    <span className="font-mono-tag text-[10px] font-bold text-yellow-600 block mb-1">
                      [AFTER] EDITED VIA GEMINI
                    </span>
                    <img
                      src={currentResult.url}
                      alt="After edit"
                      className="w-full max-h-[360px] object-contain mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000] text-center">
                  <img
                    src={currentResult.url}
                    alt="Generated studio piece"
                    className="w-full max-h-[420px] object-contain mx-auto"
                  />
                </div>
              )}

              {/* Prompt meta box */}
              <div className="border border-black bg-white p-2.5 font-mono-tag text-xs space-y-1">
                <div className="text-[10px] font-bold text-neutral-500 uppercase">APPLIED PROMPT:</div>
                <div className="text-black italic">"{currentResult.prompt}"</div>
              </div>
            </div>
          ) : (
            /* Empty State Display */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-neutral-300 bg-white min-h-[340px]">
              <div className="w-16 h-16 bg-neutral-100 border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                <ImageIcon className="w-8 h-8 text-neutral-700" />
              </div>
              <h4 className="font-headline font-black text-base text-black uppercase mb-1">
                VISUAL STUDIO STAGE READY
              </h4>
              <p className="font-mono-tag text-xs text-neutral-600 max-w-md mb-4">
                Enter a text prompt to create high-density garment mockups, lookbook photography, or edit existing catalog pieces using <span className="font-bold text-black">gemini-3.1-flash-image-preview</span>.
              </p>
              <div className="flex items-center gap-2 font-mono-tag text-[10px] text-neutral-500">
                <span>Supported Ratios: 1:1 • 3:4 • 4:3 • 16:9 • 9:16</span>
              </div>
            </div>
          )}

          {/* Session History Reel */}
          {history.length > 1 && (
            <div className="mt-4 pt-3 border-t-2 border-black">
              <span className="font-mono-tag text-[10px] font-bold uppercase text-neutral-600 block mb-2">
                SESSION GENERATION REEL ({history.length} ITEMS)
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentResult(item)}
                    className={`w-20 h-20 flex-shrink-0 border-2 bg-white p-1 cursor-pointer transition-all ${
                      currentResult?.id === item.id
                        ? 'border-black shadow-[2px_2px_0px_#fff500]'
                        : 'border-neutral-300 hover:border-black'
                    }`}
                  >
                    <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
